/**
 * Text Injection Utility
 * Handles inserting text into various types of input elements
 * Supports: input[type=text], textarea, contenteditable, and custom form fields
 */

export interface TextInjectionOptions {
  appendMode?: boolean; // true = append, false = replace
  preserveSelection?: boolean; // Preserve text selection
  triggerEvents?: boolean; // Trigger change/input events
}

/**
 * Get the currently focused input element
 */
export function getActiveInputElement(): HTMLElement | null {
  const activeElement = document.activeElement as HTMLElement;

  if (!activeElement) return null;

  const tagName = activeElement.tagName.toLowerCase();
  const inputType = (activeElement as HTMLInputElement).type?.toLowerCase();

  // Check if it's a valid input element
  if (
    tagName === 'input' &&
    (inputType === 'text' ||
      inputType === 'email' ||
      inputType === 'search' ||
      inputType === 'url' ||
      inputType === 'tel' ||
      inputType === '')
  ) {
    return activeElement;
  }

  // Check if it's a textarea
  if (tagName === 'textarea') {
    return activeElement;
  }

  // Check if it's a contenteditable element
  if (activeElement.contentEditable === 'true') {
    return activeElement;
  }

  return null;
}

/**
 * Insert text at the current cursor position
 * Works with input, textarea, and contenteditable elements
 */
export function insertTextAtCursor(
  text: string,
  element?: HTMLElement | null,
  options: TextInjectionOptions = {}
): boolean {
  const target = element || getActiveInputElement();

  if (!target) {
    console.warn('No active input element found');
    return false;
  }

  const tagName = target.tagName.toLowerCase();

  try {
    if (tagName === 'input' || tagName === 'textarea') {
      return insertTextIntoInputField(target as HTMLInputElement | HTMLTextAreaElement, text, options);
    } else if (target.contentEditable === 'true') {
      return insertTextIntoContentEditable(target, text, options);
    } else {
      console.warn('Unsupported element type for text insertion');
      return false;
    }
  } catch (error) {
    console.error('Error inserting text:', error);
    return false;
  }
}

/**
 * Insert text into input or textarea element
 */
function insertTextIntoInputField(
  element: HTMLInputElement | HTMLTextAreaElement,
  text: string,
  options: TextInjectionOptions
): boolean {
  try {
    // Get current values
    const startPos = element.selectionStart || 0;
    const endPos = element.selectionEnd || 0;
    const currentValue = element.value;

    // Determine insertion behavior
    let newValue: string;

    if (options.appendMode) {
      // Append mode: add text at the end
      newValue = currentValue + (currentValue.endsWith(' ') ? '' : ' ') + text;
    } else if (startPos !== endPos) {
      // Text is selected: replace selection
      newValue = currentValue.substring(0, startPos) + text + currentValue.substring(endPos);
    } else {
      // No selection: insert at cursor position
      newValue = currentValue.substring(0, startPos) + text + currentValue.substring(startPos);
    }

    // Set the new value
    element.value = newValue;

    // Calculate new cursor position
    const newCursorPos = startPos + text.length;

    // Restore cursor position if needed
    if (!options.preserveSelection) {
      try {
        element.setSelectionRange(newCursorPos, newCursorPos);
      } catch (error) {
        // Some input types don't support setSelectionRange
        console.warn('Could not set selection range:', error);
      }
    }

    // Trigger events to notify the page of the change
    if (options.triggerEvents !== false) {
      triggerInputEvents(element);
    }

    // Focus the element to ensure visibility
    element.focus();

    return true;
  } catch (error) {
    console.error('Error inserting text into input field:', error);
    return false;
  }
}

/**
 * Insert text into contenteditable element
 * Used by Gmail, Slack, Twitter, and other rich text editors
 */
function insertTextIntoContentEditable(
  element: HTMLElement,
  text: string,
  options: TextInjectionOptions
): boolean {
  try {
    // Focus the element
    element.focus();

    // Get the current selection/cursor
    const selection = window.getSelection();

    if (!selection) {
      console.warn('Could not get window selection');
      return false;
    }

    // Get the current range
    let range: Range | null = null;

    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    }

    if (!range) {
      // No selection, create a new range at the end
      range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
    }

    // Delete selected content if any
    if (!selection.isCollapsed) {
      range.deleteContents();
    }

    // Create a text node with the new text
    const textNode = document.createTextNode(text + ' ');

    // Insert the text node
    range.insertNode(textNode);

    // Move cursor after the inserted text
    range.setStartAfter(textNode);
    range.collapse(true);

    // Update the selection
    selection.removeAllRanges();
    selection.addRange(range);

    // Trigger events
    if (options.triggerEvents !== false) {
      triggerContentEditableEvents(element);
    }

    return true;
  } catch (error) {
    console.error('Error inserting text into contenteditable element:', error);
    return false;
  }
}

/**
 * Trigger input/change events for input and textarea elements
 * This notifies the page that the value has changed
 */
function triggerInputEvents(element: HTMLElement): void {
  try {
    // Trigger input event (fires as user types)
    element.dispatchEvent(
      new Event('input', {
        bubbles: true,
        cancelable: true,
      })
    );

    // Trigger change event (fires on blur/change)
    element.dispatchEvent(
      new Event('change', {
        bubbles: true,
        cancelable: true,
      })
    );
  } catch (error) {
    console.error('Error triggering input events:', error);
  }
}

/**
 * Trigger events for contenteditable elements
 */
function triggerContentEditableEvents(element: HTMLElement): void {
  try {
    // Trigger input event
    element.dispatchEvent(
      new Event('input', {
        bubbles: true,
        cancelable: true,
      })
    );

    // Some editors respond to beforeinput
    element.dispatchEvent(
      new Event('beforeinput', {
        bubbles: true,
        cancelable: true,
      })
    );

    // Trigger change event
    element.dispatchEvent(
      new Event('change', {
        bubbles: true,
        cancelable: true,
      })
    );
  } catch (error) {
    console.error('Error triggering contenteditable events:', error);
  }
}

/**
 * Get the current text value from the active element
 */
export function getActiveInputValue(): string {
  const element = getActiveInputElement();

  if (!element) return '';

  const tagName = element.tagName.toLowerCase();

  if (tagName === 'input' || tagName === 'textarea') {
    return (element as HTMLInputElement | HTMLTextAreaElement).value;
  } else if (element.contentEditable === 'true') {
    return element.textContent || '';
  }

  return '';
}

/**
 * Clear the active input element
 */
export function clearActiveInput(): boolean {
  const element = getActiveInputElement();

  if (!element) return false;

  const tagName = element.tagName.toLowerCase();

  try {
    if (tagName === 'input' || tagName === 'textarea') {
      (element as HTMLInputElement | HTMLTextAreaElement).value = '';
      triggerInputEvents(element);
      return true;
    } else if (element.contentEditable === 'true') {
      element.textContent = '';
      triggerContentEditableEvents(element);
      return true;
    }
  } catch (error) {
    console.error('Error clearing input:', error);
    return false;
  }

  return false;
}

/**
 * Check if the active element is an input field
 */
export function isActiveElementTextInput(): boolean {
  return getActiveInputElement() !== null;
}

/**
 * Get element information for debugging
 */
export function getActiveElementInfo(): {
  tagName: string;
  type: string;
  placeholder: string;
  isFocused: boolean;
  isContentEditable: boolean;
} {
  const element = document.activeElement as HTMLElement;

  return {
    tagName: element?.tagName || 'none',
    type: (element as HTMLInputElement)?.type || 'none',
    placeholder: (element as HTMLInputElement)?.placeholder || 'none',
    isFocused: document.activeElement === element,
    isContentEditable: element?.contentEditable === 'true',
  };
}
