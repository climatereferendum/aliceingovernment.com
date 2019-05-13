import { html, render } from 'lit-html'
import { installRouter } from './node_modules/pwa-helpers/router.js'
import csv from 'neat-csv'
import { flag } from 'country-emoji'

const DOC_URL = 'https://docs.google.com/spreadsheets/d/1WNDWjJOGeVbOsYaWy3udBnRxFIknO5NpYwToVhH2nGE/gviz/tq?tqx=out:csv'
const PREVIEW_VOTES_COUNT = 5
let solutions
let votes, votesCount
let myVotes = []
const form = document.querySelector('#vote-form')
form.addEventListener('submit', (event) => {
  event.preventDefault()
  event.stopPropagation()
  const data = new FormData (form)
  for (const key of data.keys()) { console.log(key, data.get(key)) }
  return false
})

function updateMyVotes (event) {
  myVotes.push(event.target.value)
  const solutionElements = document.querySelectorAll('#solutions .project-box')
  const nav = document.querySelector('.sticky-nav')
  const footer = document.querySelector('footer')
  if (myVotes.length === 3) {
    // hide other solutions
    for (const element of solutionElements) {
      if (!myVotes.includes(element.dataset.rank)) {
        element.classList.add('inactive')
      }
    }
    // show form, hide navigation and footer
    nav.classList.add('inactive')
    footer.classList.add('inactive')
    form.classList.remove('inactive')
    form.scrollIntoView(false)
  } else {
    // show all solutions
    for (const element of solutionElements) {
      element.classList.remove('inactive')
    }
    // hide form, show navigation and footer
    form.classList.add('inactive')
    nav.classList.remove('inactive')
    footer.classList.remove('inactive')
  }
}

;(async () => {
  const solutionsResponse = await window.fetch(DOC_URL + '&sheet=solutions')
  const solutionsCsv = await solutionsResponse.text()
  solutions = await csv(solutionsCsv)
  renderSolutions(solutions)
  installRouter(handleRouting)
})()

const pages = document.querySelectorAll('.page')
const nav = {
  solutions: document.querySelector('#nav-solutions'),
  votes: document.querySelector('#nav-votes'),
  info: document.querySelector('#nav-info')
}

async function handleRouting (location, event) {
  if (event && event.type === 'click') {
    window.scrollTo(0, 0)
  }
  for (const page of pages) {
    page.classList.add('inactive')
  }
  for (const n in nav) {
    nav[n].classList.remove('active')
    nav[n].classList.remove('active-prev')
  }
  const active = location.pathname.split('/')[1]
  const slug = location.pathname.split('/')[2]
  let linkedHeader = true
  if (active === '') {
    document.querySelector('#home').classList.remove('inactive')
    linkedHeader = false
  }
  if (active === 'solutions' && !slug) {
    nav['solutions'].classList.add('active')
    document.querySelector('#solutions').classList.remove('inactive')
  }
  if (active === 'votes' && !slug) {
    nav['solutions'].classList.add('active-prev')
    nav['votes'].classList.add('active')
    if (!votes) [votes, votesCount] = await fetchVotes()
    renderVotes(votes)
    document.querySelector('#votes').classList.remove('inactive')
  }
  if (active === 'info') {
    nav['solutions'].classList.add('active-prev')
    nav['votes'].classList.add('active-prev')
    nav['info'].classList.add('active')
    document.querySelector('#info').classList.remove('inactive')
  }
  if (active === 'votes' && slug) {
    nav['solutions'].classList.add('active-prev')
    nav['votes'].classList.add('active')
    if (!votes) [votes, votesCount] = await fetchVotes()
    const country = Object.keys(votes).find(country => country.toLowerCase() === slug)
    const countryVotes = votes[country]
    renderCountry(country, countryVotes)
    document.querySelector('#country').classList.remove('inactive')
  }
  renderHeader(linkedHeader)
}

async function fetchVotes () {
  const votesResponse = await window.fetch(DOC_URL + '&sheet=votes')
  const votesCsv = await votesResponse.text()
  const votes = await csv(votesCsv)
  const reduced = votes.reduce((acc, vote) => {
    if (!acc[vote.country]) {
      acc[vote.country] = []
    }
    acc[vote['country']].push(vote)
    return acc
  }, {})
  // add index per country
  for (const country in reduced) {
    reduced[country] = reduced[country].map((vote, index) => {
      return { index: index + 1, ...vote }
    })
    reduced[country].reverse()
  }
  return [reduced, votes.length]
}

function renderHeader (linked = true) {
  let headerTemplate = html`
    <img src="/img/logo.png">
  `
  if (linked) {
    headerTemplate = html`
    <a href="/">
      ${headerTemplate}
    </a>
    `
  }

  render(headerTemplate, document.querySelector('#header'))
}

function solutionTemplate (solution) {
  return html`
    <div class="project-box col-xs-6" data-rank=${solution.rank}>
        <a href="${solution.link}" target="drawdown">
        <h4>Solution #${solution.rank}</h4>
        <h3>${solution.name}</h3></a>
        <label class="container">
          <input
            type="checkbox"
            name="solution-${solution.rank}"
            value="${solution.rank}"
            @change="${updateMyVotes}"
            >
          <span class="checkmark"></span>
        </label> 
    </div>
  `
}

function renderSolutions (solutions) {
  const solutionsHeader = html`
    <h2 class="h-boxed" style="margin-bottom: 32px;">To make things easier, here is a list of the<br> 
      Top 30 most effective Solutions<br> 
      to Climate Change as compiled by the <br>
      wonderful team of scientists at <a href="https://www.drawdown.org/" target="_blank">Drawdown</a>. <br>
      <div class="vertical-line"></div>
      Please select three (3) by ticking <br>the checkboxes to cast your vote.
    </h2>
    <div class="row">
      <div class="select-block">SELECT</div>
    </div>
  `

  const solutionsTemplate = html`
    ${solutionsHeader}
    ${solutions.map(solutionTemplate)}
  `
  render(solutionsTemplate, document.querySelector('#solutions'))
}

function loadMoreLink (country, countryVotes) {
  if (countryVotes.length > PREVIEW_VOTES_COUNT) {
    return html`<a href="/votes/${country.toLowerCase()}"><i>load more ↓</i></a>`
  }
}

function renderVotes (votes) {
  const orderedCountries = Object.keys(votes).sort((first, second) => {
    return votes[second].length - votes[first].length
  })
  const listTemplate = html`${
    orderedCountries.map(country => {
      return html`
        <div class="vertical-line"></div>
        <div class="project-box votes">
          <h2>
            ${flag(country)}
            ${country}
          </h2>
          <span>${votes[country].length} VOTES</span>
        </div>
        <div class="project-box solution content">
            <ul>
              ${votes[country].slice(PREVIEW_VOTES_COUNT * -1).map(voteTemplate)}
            </ul>
            ${loadMoreLink(country, votes[country])}
        </div>
      `
    })
  }`
  const pageTemplate = html`
    <div class="flex-wrap">
      <div class="project-box solution">
        <h3>People defining our global strategy:</h3>
        Total # of Voters: ${votesCount}
        <br>
        Countries: ${Object.keys(votes).length}
      </div>
      ${listTemplate}
    </div>
  `
  render(pageTemplate, document.querySelector('#votes'))
}

function voteTemplate (vote) {
  return html`
  <li>
    <em class="index">${vote.index}</em>
    <strong>${vote.name}</strong>
    <em>${vote.organization}</em>
  </li>
  `
}

function renderCountry (country, countryVotes) {
  const countryTemplate = html`
    <div class="project-box votes">
      <h2>
        ${flag(country)}
        ${country}
      </h2>
      <span>${votes[country].length} VOTES</span>
    </div>
    <div class="project-box solution">
      <ul>${countryVotes.map(voteTemplate)}</ul>
    </div>
  `
  const pageTemplate = html`
    <div class="flex-wrap">
      ${countryTemplate}
    </div>
  `

  render(pageTemplate, document.querySelector('#country'))
}
