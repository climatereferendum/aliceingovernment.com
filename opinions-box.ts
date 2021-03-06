import { LitElement, customElement, property, css, query } from 'lit-element'
import { html } from 'lit-html'

@customElement('opinions-box')
export class OpinionsBox extends LitElement {

  @property({ type: Array })
  universities

  @property({ type: Object })
  country

  @property({ type: Object })
  localize

  static styles = css`
    *,::after,::before {
        box-sizing: border-box
    }
    ul {
      padding: 0;
    }
    li {
      margin: 1.5em 0;
    }
    .project-box{
        background: var(--light-color);
        color: var(--dark-font-color);
        width: 95%;
        margin: 5% auto;
        padding: 16px;
        border-bottom: 1px solid #333333;
    }
    .solution, .votes {
        width: 100%;
        min-height: 60px;
        margin-top: 0;
        margin-bottom: 0;
    }

    .solution i{
        display: block;
        text-align: right;
    }

    .votes{
        background: #000000;
        color: #ffffff;
        min-height: 40px;
    }

    .votes h2{
        margin-left: 0;
        font-size: 20px;
        width: 70%;
        margin: 0;
        line-height: 1.5rem;
    }

    .votes span{
        background: #ffffff;
        color: #000000;
        top: -46px;
        font-size: 16px;
    }

    .solution ul {
        list-style: none;
    }

    .votes .counter {
      padding: 2px 4px;
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
    strong {
        font-weight: 500;
        font-size: 1.2rem;
    }
    .opinion {
      margin-top: 0.5em;
    }
    h2 a, h2 a:hover {
      display: block;
      color: #fff;
      text-decoration: none
    }
  `
  get universityName () {
    const university = this.universities.find(u => u.domains.includes(this.country.code))
    if (university) return university.name
  }

  voteTemplate (vote) {
    return html`
    <li>
      <div>
        <strong>${vote.name}</strong>
      </div>
      <div class="opinion">${vote.opinion}</div>
    </li>
    `
  }

  headerTemplate () {
    return html`
      <h2>
       ${this.universityName}
      </h2>
      <span class="counter">${this.country.count} ${this.localize('votes')}</span>
    `
  }

  render () {
    return html`
      <div class="project-box votes">
        ${this.country.code ? this.headerTemplate() : ''}
      </div>
      <div class="project-box solution content">
          <ul>
            ${this.country.vote.map(this.voteTemplate)}
          </ul>
      </div>
      <div class="vertical-line"></div>
    `
  }
}
