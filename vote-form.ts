import { LitElement, customElement, property, css, query } from 'lit-element'
import { html } from 'lit-html'

import { TextField } from '@material/mwc-textfield'
import '@material/mwc-textfield'
import { TextArea } from '@material/mwc-textarea'
import '@material/mwc-textarea'
import '@material/mwc-checkbox'
import '@material/mwc-button'
import '@material/mwc-formfield'

import './solution-result'
import { SolutionResult } from './solution-result'

@customElement('vote-form')
export class VoteForm extends LitElement {

  @property( {type: Array} )
  emailProviders

  @property({ type: Array })
  solutions
  
  @property({ type: String })
  serviceUrl

  @property({ type: Array })
  stats

  @property({ type: Object })
  university

  @property({ type: Boolean })
  form = true

  @property({ type: Object })
  localize

  get globalResults () {
    return this.stats.global.result
  }

  get results () {
      if (this.university) {
        return this.stats.country.find(u => this.university.domains.includes(u.code)).result
      } else {
        return this.globalResults
      }
  }

  @property({ type: Number })
  expectedSolutions

  @property({ type: Array })
  private selectedSolutions = []

  @query('mwc-textfield[name=email]')
  protected emailField: TextField

  @query('mwc-textfield[name=name]')
  protected nameField: TextField
  
  @query('mwc-textarea[name=opinion]')
  protected opinionField: TextArea

  @query('#formfields-wrapper')
  protected formfieldsWrapper: HTMLElement

  @property({ type: String })
  email

  @property({ type: Boolean })
  nameValid = false

  @property({ type: Boolean })
  acceptValid = false

  @property({ type: Boolean })
  nonUniversityEmailDomain = false

  @property({ type: String })
  state = 'initial'

  @property({ type: Boolean })
  withCheckboxes = true

  static styles = css`
    h3 {
        font-size: 1.75rem;
        font-weight: 500;
    }
    .inactive {
        display: none !important;
    }
    #formfields-wrapper div.formfield {
        margin: 1.5em 0;
    }

    mwc-button {
        --mdc-theme-primary: #fab114;
        --mdc-theme-on-primary: var(--light-color);
    }

    mwc-textfield, mwc-textarea {
        width: 100%;
        --mdc-theme-error: var(--university-color);
        --mdc-text-field-label-ink-color: var(--light-color);
        --mdc-text-field-outlined-idle-border-color: var(--light-color);
        --mdc-text-field-ink-color: var(--light-color);
        --mdc-theme-primary: var(--light-color);
    }

    #formfields-wrapper mwc-checkbox {
        --mdc-checkbox-unchecked-color: var(--light-color);
    }

    #formfields-wrapper mwc-formfield {
        --mdc-theme-text-primary-on-background: var(--light-color);
        --mdc-checkbox-mark-color: var(--highlight-color);
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

    .info, .error, #vote-exists, #please-confirm, #error {
        border-width: 1px;
        border-style: solid;
        padding: 0.5em;
        border-radius: 0.2em;
    }

    .info, #please-confirm {
        border-color: #267fb5;
        font-size: 0.9rem;
    }

    .error, #error {
        color: var(--university-color);
        border-color: var(--university-color);
    }

    .error {
        margin-top: 1em;
    }

    #vote-exists, #please-confirm p.primary, #error { 
        font-size: 1.5em;
    }

    #vote-exists {
        border-color: var(--highlight-color);
    }
    
    /* TODO: DRY */
    .step {
        display: block;
        width: 2em;
        height: 2em;
        margin: 0 auto 2rem;
        font-size: 3em;
        border: 2px solid;
        border-radius: 1.5em;
        text-align: center;
        line-height: 2em;
        color: var(--highlight-color);
    }

    #formfields-wrapper {
        padding: 30px;
        background-color: var(--highlight-color);
        color: var(--light-color);
        padding-top: 3rem;
    }

    #formfields-wrapper .step {
        color: var(--light-color);
    }

    .solution {
        display: flex;
        border-top: 1px solid gray;
        border-bottom: 1px solid gray;
        padding-top: 0.5rem;
    }

    .solution solution-result {
        display: block;
        width: 90%;
        padding-left: 1em;
        margin-bottom: 1em;
    }
  `
    solutionTemplate (solution) {
        return html`
        <div class="solution">
            <solution-result
              .solution=${solution}
              .university=${this.university}
              .results=${this.results}
              .globalResults=${this.globalResults}
              .localize=${this.localize}
            ></solution-result>
            ${this.withCheckboxes ? html`
                <mwc-checkbox
                    .checked="${this.selectedSolutions.find(s => s === solution.slug)}"
                    @change="${this.updateSelectedSolutions}"
                    data-slug=${solution.slug}>
                ></mwc-checkbox>
            ` : ''}
        </div>
        `
    }

    updateSelectedSolutions (event) {
        if (event.target.checked) {
            this.selectedSolutions = [
                ...this.selectedSolutions,
                event.target.dataset.slug
            ]
        } else {
            this.selectedSolutions = this.selectedSolutions.filter(s => s !== event.target.dataset.slug)
        }
        if (this.selectedSolutions.length === this.expectedSolutions) {
            setTimeout(() => this.shadowRoot.querySelector('#solutions').scrollIntoView())
        }
    }

  nonUniversityEmailMessage () {
      if (this.email && this.nonUniversityEmailDomain) {
          return html `
            <div class="error">
                ${this.localize('nonuniversityemail')}
            </div>
          ` 
      }
  }

  solutionsList () {
      const list = []
      if (this.results) {
        this.solutions.sort((a, b) => {
          const aResultIndex = this.results.indexOf(this.results.find(result => result.solution === a.slug))
          const bResultIndex = this.results.indexOf(this.results.find(result => result.solution === b.slug))
          return aResultIndex - bResultIndex
        })
      }
      for (const solution of this.solutions) {
        if (this.selectedSolutions.length < this.expectedSolutions
            || this.selectedSolutions.includes(solution.slug)) {
                list.push(this.solutionTemplate(solution))
        }
      }
      return html`
        <div id="solutions">
            ${list}
        </div>
      `
  }

  async handleSubmit (event) {
    this.state = 'pending'
    const draft: any = {
      email: this.email,
      name: this.nameField.value,
      opinion: this.opinionField.value ? this.opinionField.value : null,
      policiesAgreement: this.acceptValid,
      solutions: [...this.selectedSolutions]
    }
    // vote ready to submit
    try {
        const castedVoteResponse = await fetch(this.serviceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
        })
        this.selectedSolutions = []
        this.withCheckboxes = false
        setTimeout(() => this.formfieldsWrapper.scrollIntoView())
        if (castedVoteResponse.ok) {
        console.log('VOTE SUBMISSION SUCCEEDED')
        this.state = 'success'
        this.dispatchEvent(new CustomEvent('success'))
        } else {
        console.log('VOTE SUBMISSION FAILED')
        this.state = 'error'
        // if status 409 - vote for that email exists
        if (castedVoteResponse.status === 409) {
            this.state = 'vote-already-exists'
        }
        }
    } catch (err) {
      this.state = 'error'
      setTimeout(() => this.formfieldsWrapper.scrollIntoView())
    }
  }

  formPartial() {
    return html`
    ${ this.expectedSolutions === this.selectedSolutions.length ?
        '' :
        html`
        <div class="error">
            ${ this.expectedSolutions - this.selectedSolutions.length === 1 ?
               this.localize('select1more') :
               this.localize('selectnmore', { number: this.expectedSolutions - this.selectedSolutions.length })
            }
        </div>
        `  
    }
    <div class="formfield">
        <mwc-textfield
            outlined
            required
            helperPersistent
            name="email"
            type="email"
            label=${this.localize('labelemail')}
            helper=${this.localize('helperemail')}
            validationMessage=${this.localize('valmsgemail')}
            maxLength="50">
        </mwc-textfield>
    </div>
    ${this.nonUniversityEmailMessage()}
    <div class="formfield">
        <mwc-textfield
            outlined
            required
            name="name"
            type="text"
            label=${this.localize('labelname')}
            validationMessage=${this.localize('valmsgname')}
            maxLength="50">
        </mwc-textfield>
    </div>
    <div>
        ${this.localize('whatshould')}
    </div>
    <div class="formfield">
        <mwc-textarea
            outlined
            charCounter
            helperPersistent
            name="opinion"
            label=${this.localize('labelopinion')}
            helper=""
            maxLength="160">
        </mwc-textarea>
    </div>
        <p>
          <a href="/privacy-policy" style="color:#ffffff;"><u>${this.localize('privacypolicy')}</u></a>,
          <a href="/terms-of-service" style="color:#ffffff;"><u>${this.localize('tos')}</u></a>,
          ${this.localize('and18')}</p>
        <div id="side-by-side">
            <mwc-formfield label=${this.localize('iaccept')}>
                <mwc-checkbox
                    required
                    name="policiesAgreement"
                    @change=${(e) => this.acceptValid = e.target.checked}
                ></mwc-checkbox>
            </mwc-formfield>
            <mwc-button
                raised
                ?disabled=${
                    !this.email ||
                    this.nonUniversityEmailDomain ||
                    !this.nameValid ||
                    !this.acceptValid ||
                    this.selectedSolutions.length !== this.expectedSolutions
                }
                @click=${this.handleSubmit}
                label=${this.localize('submit')}>
            </mwc-button>
        </div>
    `
  }
  
  statePartial () {
    switch (this.state) {
      case 'pending':
        return html`
          <p id="submitting">${this.localize('submitting')}</p>
        `
      case 'success':
          return html`
            <div id="please-confirm">
                <p class="primary">${this.localize('pleaseconfirm')}</p>
                <p>(${this.localize('canclose')})</p>
            </div>
          `
      case 'vote-already-exists':
        return html`
            <p id="vote-exists">${this.localize('voteexists')}</p>
        `
      case 'error':
          return html`
            <p id="error">${this.localize('erroroccured')}</p>
          `
      default:
        return this.formPartial()
    }
  }

  render () {
    return html `
        ${this.solutionsList()}
        <div id="formfields-wrapper" class="${ this.form ? '' : 'inactive'}">
            <div class="step">2</div>
            <h3>${ this.localize('completevote') }</h3>
            ${this.statePartial()}
        </div>
    `
  }

  firstUpdated() {
      this.emailField.validityTransform = (newValue, nativeValidity) => {
          this.email = null
          this.nonUniversityEmailDomain = false
          if (nativeValidity.valid) {
              this.email = newValue
              const domain = newValue.split('@')[1]
              for (const provider of this.emailProviders) {
                  if (domain.match(new RegExp(`${provider}$`))) {
                      this.nonUniversityEmailDomain = true
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
