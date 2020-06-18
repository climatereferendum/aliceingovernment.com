import { LitElement, customElement, property, css } from 'lit-element'
import { html } from 'lit-html'


@customElement('stats-box')
export class StatsBox extends LitElement {

  @property({ type: Object })
  stats

  @property({ type: Array })
  universities

  private get max () {
    return this.stats.country[0].count
  }
  

  static styles = css`
    * {
      box-sizing: border-box;
    }
    #stats {
      padding: 0 1.5rem;
    }
    .stat {
      margin-bottom: 1.25rem;
    }
    a {
      text-decoration: none;
      display: flex;
      padding-bottom: 0.5rem;
      font-weifht: 500;
    }
    .name {
      font-size: 1.15rem;
      color: var(--highlight-color);
      flex: 1;
    }
    .decorated {
      text-decoration: underline;
    }
    .name .count {
      font-size: 0.95rem;
      color: black;
      width: 1rem;
    }
    .arrow {
      margin-right: -0.75rem;
    }
    .bar {
        height: 1.25rem;
    }
    .university {
        background-color: var(--university-color);
    }
  `
  private linkTo (university) {
    return `/${university.slug}`
  }
  private resultBar (stat) {
    const university = this.universities.find(uni => uni.slug === stat.code)
    return html`
      <div class="stat">
        <a href=${this.linkTo(university)}>
          <div class="name">
            <span class="decorated">${university.name}</span>
            <span class="count">${stat.count} vote${stat.count === 1 ? '' : 's'}</span>
          </div>
          <div class="arrow">〉</div>
        </a>
        <div class="bar university" style="width: ${(stat.count / this.max) * 100}%"></div>
      </div>
      `
  }

  render () {
    return html`
      <div id="stats">
        ${this.stats.country.map(uni => this.resultBar(uni))}
      </div>
    `
  }
}