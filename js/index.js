import { html, render } from 'lit-html'
import { solutions } from './data'

const pairs = solutions.reduce((acc, cur, idx, src) => {
  if (idx % 2 === 0) {
    const first = src[idx]
    const pair = [first]
    const second = src[idx + 1]
    if (second) pair.push(second)
    acc.push(pair)
  }
  return acc
}, [])

function itemTemplate (solution) {
  return html`
    <div class="project-box col-xs-6">
        <a href="${solution.slug}">
        <h4>Solution #${solution.ranking}</h4>
        <h3>${solution.name}</h3></a>
    </div>
  `
}

function verticalLineTemplate (idx) {
  if (idx > 0) {
    if (idx % 2 === 0) {
      return html`<div class="vert-right-line"></div>`
    } else {
      return html`<div class="vert-left-line"></div>`
    }
  }

}

const solutionsTemplate = html`${
  pairs.map((pair, idx) => {
    return html`
      ${verticalLineTemplate(idx)}
      <div class="row">
        ${itemTemplate(pair[0])}
        <div class="hor-line"></div>
        ${itemTemplate(pair[1])}
      </div>
    `
  })
}`

render(solutionsTemplate, document.querySelector('.container'))
