import { LitElement, customElement, property, css, query } from 'lit-element'
import { html } from 'lit-html'
import { universities, emailProviders } from '@aliceingovernment/data'

import { TextField } from '@material/mwc-textfield'
import '@material/mwc-textfield'
import '@material/mwc-textarea'
import '@material/mwc-checkbox'
import '@material/mwc-button'
import '@material/mwc-formfield'

@customElement('vote-form')
export class VoteForm extends LitElement {

  @property({ type: Array })
  solutions

  @property({ type: Number })
  expectedSolutions

  @property({ type: Array })
  private selectedSolutions = []

  @query('mwc-textfield[name=email]')
  protected emailField: TextField

  @query('mwc-textfield[name=name]')
  protected nameField: TextField

  @property({ type: Boolean })
  eligibleEmailDomain = false

  @property({ type: Boolean })
  nonUniversityEmailDomain = false

  @property({ type: Boolean })
  nameValid = false

  @property({ type: Boolean })
  acceptValid = false

  @property({ type: String })
  email

    solutionTemplate (solution) {
        return html`
            <div class="project-box" data-slug=${solution.slug}>
            <label class="container">
                <h3>${solution.name}</h3>
                <input
                type="checkbox"
                name="solution-${solution.slug}"
                value="${solution.slug}"
                ?checked="${this.selectedSolutions.includes(solution.slug)}"
                @change="${this.updateSelectedSolutions}">
                <span class="checkmark"><span>VOTE</span></span>
            </label>      
            <div class="clear"></div>
            </div>
        `
    }

    updateSelectedSolutions (event) {
        if (event.target.checked) {
            this.selectedSolutions = [
                ...this.selectedSolutions,
                event.target.value
            ]
        } else {
            this.selectedSolutions = this.selectedSolutions.filter(s => s !== event.target.value)
        }
    }


  static styles = css`
    div {
        margin: 1.5em 0;
    }

    mwc-textfield, mwc-textarea {
        width: 100%;
    }

    mwc-button {
        --mdc-theme-primary: #fab114;
        --mdc-theme-on-primary: var(--light-color);
    }

    mwc-textfield, mwc-textarea {
        --mdc-text-field-label-ink-color: var(--light-color);
        --mdc-text-field-outlined-idle-border-color: var(--light-color);
        --mdc-text-field-ink-color: var(--light-color);
        --mdc-theme-primary: var(--light-color);
    }

    mwc-checkbox {
        --mdc-checkbox-unchecked-color: var(--light-color);
    }

    mwc-formfield {
        --mdc-theme-text-primary-on-background: var(--light-color);
        --mdc-checkbox-mark-color: var(--dark-color);
        --mdc-theme-secondary: var(--light-color);
        margin-top: -0.5em;
        margin-left: -0.5em;
    }

    p {
        margin-bottom: 0;
    }
    #side-by-side {
        display: flex;
        justify-content: space-between;
        margin-top: 1em;
    }

    #not-participating, #non-university {
        border-width: 2px;
        border-style: solid;
        font-style: italic;
        padding: 0.5em;
        border-radius: 0.2em;
    }

    #not-participating {
        border-color: #267fb5;
    }

    #non-university {
        border-color: #b00020;
    }
    
    /* TODO: DRY */
    .step {
        display: block;
        width: 2em;
        height: 2em;
        margin: 0 auto;
        font-size: 3em;
        border: 2px solid;
        border-radius: 1.5em;
        text-align: center;
        line-height: 2em;
        color: var(--dark-color);
    }

    #formfields-wrapper {
        padding: 30px;
        background-color: var(--dark-color);
        color: var(--light-color);
        padding-top: 3rem;
    }

    #formfields-wrapper .step {
        color: var(--light-color);
    }

    /* TODO: DRY */
    .project-box{
        background: var(--light-color);
        color: var(--dark-font-color);
        width: 95%;
        margin: 5% auto;
        padding: 16px;
        /**min-height: 160px;**/
        z-index: 10;
        border-bottom: 1px solid #333333;
    }

    .clear {
        clear: both;
    }

    .project-box h3{
        font-weight: bold;
        font-size: 16px;
        margin: 0;
    }

    .project-box span.counter,
    .project-box span.checkmark{
        position: relative;
        float: right;
        top: -24px;
        color: #000000;
        left: 10px;
        margin-bottom: -24px;
        text-align: center;
        padding: 0 4px;
        border: 1px solid #000000;
    }

    .project-box span.counter {
        top: -34px;
        padding: 2px 4px;
    }
    .project-box span.checkmark span{
        position: absolute;
        top: -20px;
        left: 5px;
        font-size: 10px;
    }

    /* The container */
    .container {
    display: block;
    position: relative;
    float: right;
    padding-left: 35px;
    margin-bottom: 12px;
    cursor: pointer;
    font-size: 22px;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    }

    /* Hide the browser's default checkbox */
    .container input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
    }

    /* Create a custom checkbox */
    .checkmark {
    position: absolute;
    top: 0;
    left: 0;
    height: 40px;
    width: 40px;
    background-color: #eee;
    }

    .container {
        width: 100%;
        padding-right: 15px;
        padding-left: 15px;
        margin-right: auto;
        margin-left: auto
    }

    /* On mouse-over, add a grey background color */
    .container:hover input ~ .checkmark {
    background-color: #ccc;
    }

    /* When the checkbox is checked, add a blue background */
    .container input:checked ~ .checkmark {
    background-color: #2699FB;
    }

    /* Create the checkmark/indicator (hidden when not checked) */
    .checkmark:after {
    content: "";
    position: absolute;
    display: none;
    }

    /* Show the checkmark when checked */
    .container input:checked ~ .checkmark:after {
    display: block;
    }

    /* Style the checkmark/indicator */
    .container .checkmark:after {
    left: 12px;
    top: 2px;
    width: 14px;
    height: 28px;
    border: solid #000000;
    border-width: 0 3px 3px 0;
    -webkit-transform: rotate(45deg);
    -ms-transform: rotate(45deg);
    transform: rotate(45deg);
    }

  `

  eligibilityMessage () {
      if (this.email && !this.eligibleEmailDomain && !this.nonUniversityEmailDomain) {
          return html `
            <div id="not-participating">
              Domain of your email address doesn't appear to be from any of the
              participating universities. We will receive your vote and contact you
              in order to coordinate adding the participation of your university.
            </div>
          ` 
      }
  }

  nonUniversityEmailMessage () {
      if (this.email && this.nonUniversityEmailDomain) {
          return html `
            <div id="non-university">
              It appears that you've entered email address provided by one of known
              non university email providers. Please enter email address provided by your university.
            </div>
          ` 
      }
  }

  solutionsList (solutions) {
      const list = []
      for (const solution of solutions) {
        if (this.selectedSolutions.length < this.expectedSolutions
            || this.selectedSolutions.includes(solution.slug)) {
                list.push(this.solutionTemplate(solution))
            }
      }
      return list
  }

  render () {
    return html `
        ${this.solutionsList(this.solutions)}
        <div id="formfields-wrapper">
            <div class="step">2</div>
            <h3>Complete your vote</h3>
            <div>Share your opinion with the world</div>
            ${ this.expectedSolutions === this.selectedSolutions.length ?
               '' :
               html`
                <div>
                    Select
                    ${this.expectedSolutions - this.selectedSolutions.length}
                    more solutions
                </div>
              `  
            }
            <div>
                <mwc-textfield
                    outlined
                    required
                    helperPersistent
                    name="email"
                    type="email"
                    label="email"
                    helper="provided by the univeristy"
                    validationMessage="please enter valid email address"
                    maxLength="50">
                </mwc-textfield>
                </div>
                ${this.eligibilityMessage()}
                ${this.nonUniversityEmailMessage()}
                <div>
                <mwc-textfield
                    outlined
                    required
                    name="name"
                    type="text"
                    label="full name"
                    validationMessage="please enter your full name"
                    maxLength="50">
                </mwc-textfield>
                </div>
                <div>
                <mwc-textarea
                    outlined
                    charCounter
                    helperPersistent
                    name="opinion"
                    label="opinion"
                    helper="what kind of action do you see missing in addressing climat change"
                    maxLength="160">
                </mwc-textarea>
                </div>
                <p>Our <a href="/privacy-policy" target="_blank" style="color:#ffffff;"><u>Privacy Policy</u></a> and <a href="/terms-of-service" target="_blank" style="color:#ffffff;"><u>Terms of Service</u></a></p>
                <div id="side-by-side">
                <mwc-formfield label="I accept *">
                    <mwc-checkbox
                        required
                        name="I accept privacy policy and terms of service"
                        @change=${(e) => this.acceptValid = e.target.checked}
                    ></mwc-checkbox>
                </mwc-formfield>
                <mwc-button
                    raised
                    ?disabled=${!this.email || this.nonUniversityEmailDomain || !this.nameValid || !this.acceptValid}
                    @click=${(e) => console.log(e.target.disabled)}
                    label="Submit">
                </mwc-button>
            </div>
        </div>
        <div style="color:#ffffff;">
            <p id="submitting" class="inactive">Submitting...</p>
            <p id="please-confirm" class="inactive">Please check your inbox for email with confirmation link (you can close this browser tab).</p>
            <p id="vote-exists" class="inactive">We already have vote for this email address, please search your inbox for permalink to your vote.</p>
        </div>
    `
  }

  firstUpdated() {
      this.emailField.validityTransform = (newValue, nativeValidity) => {
          this.email = null
          this.eligibleEmailDomain = false
          this.nonUniversityEmailDomain = false
          if (nativeValidity.valid) {
              this.email = newValue
              const domain = newValue.split('@')[1]
              for (const univeristy of universities) {
                  for (const eligibleDomain of univeristy.domains) {
                      if (domain.match(new RegExp(`${eligibleDomain}$`))) {
                          this.eligibleEmailDomain = true
                      }
                  }
              }
              if (!this.eligibleEmailDomain) {
                  for (const provider of emailProviders) {
                      if (domain.match(new RegExp(`${provider}$`))) {
                          this.nonUniversityEmailDomain = true
                      }
                  }
              }
          }
          return nativeValidity
      }
      this.nameField.validityTransform = (newValue, nativeValidity) => {
          this.nameValid = false
          if (nativeValidity.valid) {
            this.nameValid = true
          }
          return nativeValidity
      }
  }
}
