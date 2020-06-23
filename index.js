import { html, render } from 'lit-html'
import { installRouter } from './node_modules/pwa-helpers/router.js'
import '@material/mwc-snackbar'

import { solutions, universities } from '@aliceingovernment/data'
import config from './config'
import { VoteForm } from './vote-form'
import { OpinionBox } from './opinions-box'
import { StatsBox } from './stats-box'

const { fetch } = window

const CONTENT_ELEMENT_IDS = ['home', 'form-wrapper', 'voters', 'global', 'info']
const LEGAL_ELEMENT_IDS = ['privacy-policy', 'terms-of-service']

let stats

document.addEventListener('DOMContentLoaded', async () => {
  const statsResponse = await fetch(`${config.serviceUrl}`, { credentials: 'include' })
  stats = await statsResponse.json()
  installRouter(handleRouting)

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
})

function getUniversityData(slug) {
  return fetch(`${config.serviceUrl}/countries/${slug}`).then(res => res.json())
}

async function handleRouting (location, event) {
  if (event && event.type === 'click') {
    window.scrollTo(0, 0)
  }
  const contentElements = CONTENT_ELEMENT_IDS.map(id => document.querySelector(`#${id}`))
  const legalElements = LEGAL_ELEMENT_IDS.map(id => document.querySelector(`#${id}`))
  for (const element of contentElements) element.classList.remove('inactive')
  for (const element of legalElements) element.classList.add('inactive')
  document.querySelector('#my-vote').classList.add('inactive')
  document.querySelector('#links').classList.add('inactive')
  if (location.pathname === '/') {
    // TODO generic main page
    renderHeader(false)
    renderCfa()
    renderVoteForm(solutions, stats)
    renderVotes(null)
    renderGlobalResults(stats.country)
  } else {
    renderHeader(true)
    const slug = location.pathname.split('/')[1]
    if (universities.find(u => u.slug === slug)) {
      const university = universities.find(u => u.slug === slug)
      let universityStats = stats.country.find(u => u.code === slug)
      renderCfa(university)
      renderVoteForm(solutions, stats, university) 
      if (university.links) {
        renderLinks(university)
        document.querySelector('#links').classList.remove('inactive')
      }
      universityStats = await getUniversityData(slug)
      renderVotes(universityStats)
      renderGlobalResults(stats.country.filter(uni => uni.code !== university.slug))
    } else if (slug.match(/^[a-fA-F0-9]{24}$/)) {
      // TODO: render my vote
      const myVoteResponse = await fetch(`${config.serviceUrl}/votes/${slug}`)
      const myVote = await myVoteResponse.json()
      const statsResponse = await fetch(`${config.serviceUrl}`, { credentials: 'include' })
      stats = await statsResponse.json()
      let dummy = {}
      const university = universities.find(u => u.slug === myVote.university)
      if (university) {
        dummy = stats.country.find(uni => uni.code === myVote.university)
        let universityStats = await getUniversityData(university.slug)
        renderCfa(university)
        renderVoteForm(solutions, stats, university, false) 
        if (university.links) {
          renderLinks(university)
          document.querySelector('#links').classList.remove('inactive')
        }
        renderVotes(universityStats, false)
        renderGlobalResults(stats.country.filter(uni => uni.code !== university.slug))
      } else {
        renderCfa()
        renderVoteForm(solutions, stats, null, false)
        renderVotes(null, false)
        renderGlobalResults(stats.country)
      }
      dummy.vote = [myVote]
      renderMyVote(dummy)
      this.document.querySelector('#my-vote').classList.remove('inactive')
      setTimeout(() => this.document.querySelector('#my-vote').scrollIntoView())
    } else if (slug === 'privacy-policy' || slug === 'terms-of-service') {
      // show privacy policy or terms of service
      for (const element of contentElements) element.classList.add('inactive')
      for (const element of legalElements) element.classList.add('inactive')
      document.querySelector(`#${slug}`).classList.remove('inactive')
    } else {
      // TODO show 404
    }
  }
}


function renderHeader (linked = true) {
  let headerTemplate = html`
    Climate Referendum
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

function renderCfa (university) {
  const template = html`
    A tool for students to influence
    ${university ? university.name : 'their university'}'s
    climate action plan
  `
  render(template, document.querySelector('#cfa'))
}

function renderVoteForm (solutions, stats, university, form = true) {
  const solutionsHeader = html`
      <div class="step">1</div>
      <h3>
        Choose two solutions you want
        ${university ? university.name : 'your university'}
        to implement
      </h3>
  `

  const voteFormTemplate = html`
    ${form ? solutionsHeader : ''}
    <vote-form 
      .solutions=${solutions}
      .stats=${stats}
      .university=${university}
      .form=${form}
      .withCheckboxes=${form}
      .expectedSolutions=${2}
      @success=${(e) => { document.querySelector('mwc-snackbar').show() }}>
    </vote-form>
  `
  render(voteFormTemplate, document.querySelector('#form-wrapper'))
}

const pendingNotice = html`
  <p id="pending-notice">
    Your vote has been successfully registered. Rock & roll! Your university is not currently listed on our website but we will add it shortly and send you an update. Thanks!
  </p>
`

function communityTemplate (step = true) {
  return html`
    ${ step ? html`<div class="step">3</div>` : '' }
    <h3>Find out how your opinion relates to the community</h3>
  `
}

function renderGlobalResults (stats, step = true) {
  const pageTemplate = html`
    <div>
      <stats-box
        .stats=${stats}
        .universities=${universities}
      ></stats-box>
    </div>
  `
  render(pageTemplate, document.querySelector('#global'))
}

function renderVotes (stats, step = true) {
  const pageTemplate = html`
    <div>
      ${ communityTemplate(step) }
      ${ stats ? countryShortTemplate(stats) : '' }
    </div>
  `
  render(pageTemplate, document.querySelector('#voters'))
}

function renderMyVote (stats) {
  const pageTemplate = html`
    <div>
      ${ countryShortTemplate(stats) }
      ${ stats.vote && stats.vote[0].pending ? pendingNotice : '' }
    </div>
  `
  render(pageTemplate, document.querySelector('#my-vote'))
}

function renderLinks (university) {
  const template = html`
    <h3>Collaborate with groups at your university</h3>
    <ul>
    ${university.links.map(link => html`
      <li><a target="_blank" href=${link}>${link}</a></li>   
    `)}
    </ul>
  `
  render(template, document.querySelector('#links'))
}


function countryShortTemplate (country) {
  return html`<opinions-box .country=${country}></opinions-box>`
}
