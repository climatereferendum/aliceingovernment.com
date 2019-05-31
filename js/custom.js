// FAQ info accordion
const accordions = document.getElementsByClassName('accordion')

for (const accordion of accordions) {
  accordion.addEventListener('click', function () {
    this.classList.toggle('active')
    var panel = this.nextElementSibling
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null
    } else {
      panel.style.maxHeight = panel.scrollHeight + 'px'
    }
  })
}

/* Multistep Form JS */

var currentTab = 0 // Current tab is set to be the first tab (0)
showTab(currentTab) // Display the current tab

function showTab (tabIndex) {
  // This function will display the specified tab of the form ...
  const tabs = document.getElementsByClassName('tab')
  tabs[tabIndex].style.display = 'block'
  // ... and fix the Previous/Next buttons:
  if (tabIndex === 0) {
    document.getElementById('prevBtn').style.display = 'none'
  } else {
    document.getElementById('prevBtn').style.display = 'inline'
  }
  if (tabIndex === tabs.length - 1) {
    document.getElementById('nextBtn').classList.add('inactive')
  } else {
    document.getElementById('nextBtn').classList.remove('inactive')
  }
  // ... and run a function that displays the correct step indicator:
  fixStepIndicator(tabIndex)
}

function nextPrev (n) {
  // This function will figure out which tab to display
  const tabs = document.getElementsByClassName('tab')
  // Exit the function if any field in the current tab is invalid:
  if (n === 1 && !validateForm()) return false
  // Hide the current tab:
  tabs[currentTab].style.display = 'none'
  // Increase or decrease the current tab by 1:
  currentTab = currentTab + n
  // if you have reached the end of the form... :
  // Otherwise, display the correct tab:
  showTab(currentTab)
}

function validateForm () {
  // This function deals with validation of the form fields
  const tabs = document.getElementsByClassName('tab')
  let valid = true
  const currentTabInputs = tabs[currentTab].querySelectorAll('input[required]')
  const countrySelect = tabs[currentTab].getElementsByTagName('select')
  // A loop that checks every input field in the current tab:
  for (const field of [...currentTabInputs, ...countrySelect]) {
    // If a field is empty...
    if (field.value === '' || (field.type === 'checkbox' && field.required && !field.checked)) {
      // add an "invalid" class to the field:
      field.classList.add('invalid')
      // and set the current valid status to false:
      valid = false
    }
  }
  // If the valid status is true, mark the step as finished and valid:
  if (valid) {
    document.getElementsByClassName('step')[currentTab].classList.add('finish')
  }
  return valid // return the valid status
}

function fixStepIndicator (step) {
  // This function removes the "active" class of all steps...
  const elements = document.getElementsByClassName('step')
  for (const element of elements) {
    element.classList.remove('active')
  }
  // ... and adds the "active" class to the current step:
  elements[step].classList.add('active')
}
