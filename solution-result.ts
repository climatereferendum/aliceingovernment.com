import { LitElement, customElement, property, css, query } from 'lit-element'
import { html } from 'lit-html'

@customElement('solution-result')
export class SolutionResult extends LitElement {
  
  @property({ type: Object })
  solution

  @property({ type: Object })
  university

  @property({ type: Array })
  results

  @property({ type: Array })
  globalResults

  @property({ type: Boolean })
  compact = false

  static styles = css`
    *,::after,::before {
        box-sizing: border-box
    }

    .solution-name {
        line-height: 40px;
        font-weifht: 500;
    }

    .solution-description {
        font-size: 0.9rem;
    }

    .result-label {
        margin-top: 0.5rem;
        font-size: 0.85rem;
    }

    .worldwide {
        color: var(--highlight-color);
    }

    .university {
        color: var(--university-color);
    }

    .result {
        display: flex;
        line-height: 20px;
        margin-top: 0.25rem;
    }

    .count {
        width: 1.75rem;
        margin-right: 0.25rem;
        font-weifht: 500;
    }

    .worldwide .count {
        color: var(--highlight-color);
    }

    .university .count {
        color: var(--university-color);
    }

    .bar {
        height: 1.25em;
    }

    .worldwide .bar {
        background-color: var(--highlight-color);
    }

    .university .bar {
        background-color: var(--university-color);
    }
  `

  private resultBar (solutionSlug, results) {
      if (results) {
          const count = results.find(r => r.solution === solutionSlug).voteCount
          const sum = results.reduce((acc, r) => { return acc + r.voteCount}, 0)
          return html`
            <div class="count">${count}</div>
            <div class="bar" style="width: ${(count / (sum / 2)) * 100}%"></div>
            `
      }
  }

  private universityResult() {
    return html`
      ${ !this.compact ? html`<div class="result-label university">Votes by ${ this.university.name } students</div>` : '' }
      <div class="result university">${this.resultBar(this.solution.slug, this.results)}</div>
    `
  }

  private globalResult() {
    return html`
      ${ !this.compact ? html`<div class="result-label worldwide">Votes by students worldwide</div>` : '' }
      <div class="result worldwide">${this.resultBar(this.solution.slug, this.globalResults)}</div>
    `
  }


  render () {
    return html`
      <div class="solution-name">${this.solution.name}</div>
      ${ !this.compact ? html`<div class="solution-description">${this.solution.description}</div>` : '' }
      ${ this.university ? this.universityResult() : '' }
      ${ !this.compact ? this.globalResult() : '' }
    `
  }
}