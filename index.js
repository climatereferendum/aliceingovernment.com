import { html, render } from 'lit-html'
import { installRouter } from './node_modules/pwa-helpers/router.js'
import { flag, name as countryName, countries } from 'country-emoji'
import shave from 'shave'
import solutions from './solutions'
import config from './config'

const { fetch, localStorage, FormData } = window

const PREVIEW_VOTES_COUNT = 5
const SHAVED_HEIGHT = 50
let active, slug
const cache = []
let selectedSolutions = []
let authProviders
let myVote

const savedVote = localStorage.getItem('myVote')
if (savedVote) myVote = JSON.parse(savedVote)

const stickyNav = document.querySelector('.sticky-nav')
const form = document.querySelector('#vote-form')
renderCountriesDropdown()
form.addEventListener('submit', (event) => {
  event.preventDefault()
  event.stopPropagation()
  handleSubmit(event)
  return false
})

function handleSubmit (event) {
  const data = new FormData(form)
  const draft = {}
  for (const key of data.keys()) { (draft[key] = data.get(key)) }
  draft.solutions = [...selectedSolutions]
  localStorage.setItem('data', JSON.stringify(draft))
  window.location = `${config.serviceUrl}${authProviders[event.target.auth]}`
}

function showForm () {
  // show form, hide navigation
  stickyNav.classList.add('inactive')
  form.classList.remove('inactive')
  document.querySelector('.sticky-select').classList.add('inactive')
  form.scrollIntoView(false)
}

function hideForm () {
  // hide form, show navigation and footer
  form.classList.add('inactive')
  stickyNav.classList.remove('inactive')
  if (!myVote) document.querySelector('.sticky-select').classList.remove('inactive')
}

function updateSelectedSolutions (event) {
  if (event.target.checked) {
    selectedSolutions.push(event.target.value)
  } else {
    selectedSolutions = selectedSolutions.filter(s => s !== event.target.value)
  }
  // update select x more counter
  document.querySelector('.sticky-select span').innerHTML = 3 - selectedSolutions.length
  const solutionElements = document.querySelectorAll('#solutions .project-box')
  if (selectedSolutions.length === 3) {
    // hide other solutions
    for (const element of solutionElements) {
      if (!selectedSolutions.includes(element.dataset.rank)) {
        element.classList.add('inactive')
      }
    }
    showForm()
  } else {
    // show all solutions
    for (const element of solutionElements) {
      element.classList.remove('inactive')
    }
    hideForm()
  }
}

function showVote (vote) {
  window.history.pushState({}, '', '/info')
  handleRouting(window.location)
}

function hideVotingElements () {
  const votingElements = document.querySelectorAll('.not-voted')
  for (const votingElement of votingElements) {
    votingElement.classList.add('inactive')
  }
  const checkboxes = document.querySelectorAll('.checkmark')
  for (const checkbox of checkboxes) {
    checkbox.classList.add('inactive')
  }
}

const pages = document.querySelectorAll('.page')
const nav = {
  solutions: document.querySelector('#nav-solutions'),
  voters: document.querySelector('#nav-voters'),
  info: document.querySelector('#nav-info')
}

;(async () => {
  renderSolutions(solutions)
  installRouter(handleRouting)
  const serviceResponse = await fetch(config.serviceUrl, { credentials: 'include' })
  const serviceData = await serviceResponse.json()
  authProviders = serviceData.authProviders
  myVote = serviceData.vote
  let savedData = localStorage.getItem('data')
  if (savedData) {
    savedData = JSON.parse(savedData)
  }
  if (!myVote) {
    // not authenticated
    if (localStorage.getItem('myVote')) {
      localStorage.removeItem('myVote')
    }
    // TODO: if savedData should continue with voting
  } else if (myVote.solutions) {
    // already voted
    if (!localStorage.getItem('myVote')) localStorage.setItem('myVote', JSON.stringify(myVote))
    hideVotingElements()
  } else if (savedData) {
    // vote ready to submit
    myVote = Object.assign({}, myVote, savedData)
    const castedVoteResponse = await fetch(myVote.id, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(myVote)
    })
    if (castedVoteResponse.ok) {
      console.log('VOTE SUBMISSION SUCCEEDED')
      hideVotingElements()
      // draft
      localStorage.removeItem('data')
      localStorage.setItem('myVote', JSON.stringify(myVote))
      // show vote
      showVote(myVote)
    } else {
      console.log('VOTE SUBMISSION FAILED')
      if (myVote) {
        hideVotingElements()
        showVote(myVote)
      }
    }
  } else {
    console.log('AUTHENTICATED BUT NO SAVED DATA')
  }
  const statsResponse = await fetch(`${config.serviceUrl}/stats`, { credentials: 'include' })
  const stats = await statsResponse.json()
  const countries = stats.country
  document.querySelector('#voters').addEventListener('click', unshave)
  renderVotes(stats)
  for await (const country of countries) {
    await new Promise(resolve => setTimeout(resolve))
    const element = document.querySelector(`#voters-${country.code}`)
    render(countryShortTemplate(country), element)
    if (active === 'voters' && !slug) shaveOpinions(element)
  }
})()

function unshave (event) {
  const char = event.target.querySelector('.js-shave-char')
  const text = event.target.querySelector('.js-shave')
  if (char && text) {
    char.style.display = 'none'
    text.style.display = 'inline'
  }
}

function shaveOpinions (element) {
  shave(element.querySelectorAll('.opinion'), SHAVED_HEIGHT)
}

async function handleRouting (location, event) {
  if (event && event.type === 'click') {
    window.scrollTo(0, 0)
  }
  for (const page of pages) {
    page.classList.add('inactive')
  }
  hideForm()
  for (const n in nav) {
    nav[n].classList.remove('active')
    nav[n].classList.remove('active-prev')
  }
  active = location.pathname.split('/')[1]
  slug = location.pathname.split('/')[2]
  let linkedHeader = true
  if (active === '') {
    document.querySelector('#home').classList.remove('inactive')
    linkedHeader = false
  } else if (!slug) {
    document.querySelector(`#${active}`).classList.remove('inactive')
  }
  if (active === 'voters' && !slug) {
    const elements = document.querySelectorAll('#voters .country-votes')
    for await (const element of elements) {
      await new Promise(resolve => setTimeout(resolve))
      shaveOpinions(element)
    }
  }
  if (active === 'solutions') {
    nav['voters'].classList.add('active-prev')
    nav['solutions'].classList.add('active')
    if (!myVote && selectedSolutions.length === 3) {
      showForm()
    }
    if (myVote) hideVotingElements()
  }
  if (active === 'info') {
    nav['voters'].classList.add('active-prev')
    nav['solutions'].classList.add('active-prev')
    nav['info'].classList.add('active')
    if (myVote && myVote.nationality) {
      const template = html`
        <div class="my-vote">Congratulations on being part of this citizen vote on climate change</div>
        ${countryShortTemplate({ code: myVote.nationality, vote: [myVote] })}
      `
      render(template, document.querySelector('#my-vote'))
    }
  }
  if (active === 'voters' && slug) {
    nav['voters'].classList.add('active')
    let country = cache.find(c => c.code === slug)
    if (!country) {
      const countryResponse = await fetch(`${config.serviceUrl}/votes/${slug}`)
      country = await countryResponse.json()
      cache.push(country)
    }
    if (active !== 'voters') return // check again if route didn't change
    renderCountry(country)
    document.querySelector('#country').classList.remove('inactive')
  }
  if (active === 'privacy-policy' || active === 'terms-of-service') {
    stickyNav.classList.add('inactive')
  }
  renderHeader(linkedHeader)
}

function renderCountriesDropdown () {
  const template = html`
    <p><select name="nationality" onchange="this.className = ''">
        <option value=''>Select country</option>
      ${Object.keys(countries).map(code => html`
        <option value="${code.toLowerCase()}">${countries[code]} ${flag(code)}</option>
      `)}
    </select></p>
  `
  render(template, document.querySelector('#nationality'))
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
          @change="${updateSelectedSolutions}"
          >
        <span class="checkmark"></span>
      </label> 
    </div>
  `
}

function renderSolutions (solutions) {
  const solutionsHeader = html`
    <h2 class="h-boxed" style="margin-bottom: 32px; text-align:left">
      <div class="not-voted">
        <strong>Select 3 solutions</strong> to cast your vote.<br>
      </div>
      <br>
      <div style="text-align:left">
      To make things easier, here is a list of the<br> 
      top 30 most effective solutions<br> 
      to climate change as compiled by the <br>
      200+ scientists and academics at <a href="https://www.drawdown.org/" target="_blank">Drawdown</a>. <br>
      </div>
    </h2>
    <div class="row" style="max-width: 100vw;">
      <div class="select-block not-voted">SELECT 3</div>
    </div>
    <div class="sticky-select not-voted">
      <div>Select <span>3</span> more solutions</div>
    </div>
  `

  const solutionsTemplate = html`
    ${solutionsHeader}
    ${solutions.map(solutionTemplate)}
    <img src="img/m/group_1.png" class="group1">
  `
  render(solutionsTemplate, document.querySelector('#solutions'))
}

function loadMoreLink (country) {
  if (country.count > PREVIEW_VOTES_COUNT) {
    return html`<a href="/voters/${country.code.toLowerCase()}"><i>load more ↓</i></a>`
  }
}

function countryShortTemplate (country) {
  return html`
    <div class="vertical-line"></div>
    <div class="project-box votes">
      <h2>
        ${flag(country.code)}
        ${countryName(country.code)}
      </h2>
      <span class="counter">${country.count} VOTES</span>
    </div>
    <div class="project-box solution content">
        <ul class="country-votes">
          ${country.vote.map(voteTemplate)}
        </ul>
        ${loadMoreLink(country)}
    </div>
  `
}

function renderVotes (stats) {
  const pageTemplate = html`
    <div class="flex-wrap">
      <div class="project-box solution">
        <h3>Check out all the people that have voted</h3>
        <br>
        <strong>Total # of Voters</strong>: ---<strong>${stats.global.count}</strong>
        <br>
        <strong>Countries</strong>: ---<strong> ${stats.country.length} </strong>
        <br>
        <br>
        <strong>Most proactive countries :</strong>
      </div>
      ${stats.country.map(c => html`<div id="voters-${c.code}"></div>"`)}
    </div>
  `
  render(pageTemplate, document.querySelector('#voters'))
}

function voteTemplate (vote) {
  return html`
  <li>
    <div>
      <em class="index">${vote.index}</em>
      <strong>${vote.name}</strong>
      <em>${vote.description}</em>
    </div>
    <div class="opinion">${vote.opinion}</div>
  </li>
  `
}

function renderCountry (country) {
  const countryTemplate = html`
    <div class="project-box votes">
      <h2>
        ${flag(country.code)}
        ${countryName(country.code)}
      </h2>
      <span class="counter">${country.count} VOTES</span>
    </div>
    <div class="project-box solution">
      <ul class="country-votes">${country.vote.map(voteTemplate)}</ul>
    </div>
  `
  const pageTemplate = html`
    <div class="flex-wrap">
      ${countryTemplate}
    </div>
  `

  render(pageTemplate, document.querySelector('#country'))
}
