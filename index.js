import { html, render } from 'lit-html'
import { installRouter } from './node_modules/pwa-helpers/router.js'

import { solutions, universities } from '@aliceingovernment/data'
import config from './config'
import { VoteForm } from './vote-form'
import { OpinionBox } from './opinions-box'

const { fetch } = window

const CONTENT_ELEMENT_IDS = ['home', 'form-wrapper', 'voters', 'info']
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
  this.document.querySelector('#my-vote').classList.add('inactive')
  if (location.pathname === '/') {
    // TODO generic main page
    renderCfa()
    renderVoteForm(solutions, stats)
    renderVotes(stats)
  } else {
    const slug = location.pathname.split('/')[1]
    if (universities.find(u => u.slug === slug)) {
      const university = universities.find(u => u.slug === slug)
      let universityStats = stats.country.find(u => u.code === slug)
      renderCfa(university)
      renderVoteForm(solutions, stats, university) 
      universityStats = await getUniversityData(slug)
      renderVotes(universityStats, false)
    } else if (slug.match(/^[a-fA-F0-9]{24}$/)) {
      // TODO: render my vote
      const myVoteResponse = await fetch(`${config.serviceUrl}/votes/${slug}`)
      const myVote = await myVoteResponse.json()
      let dummy = {}
      const university = universities.find(u => u.slug === myVote.university)
      if (university) {
        dummy = stats.country.find(uni => uni.code === myVote.university)
        let universityStats = await getUniversityData(university.slug)
        renderVoteForm(solutions, stats, university, false) 
        renderVotes(universityStats, false, false)
      } else {
        renderVoteForm(solutions, stats, null, false)
        renderVotes(stats, true, false)
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

function renderCfa (university) {
  const template = html`
    ${university ? `${university.name} students` : 'Students'}
    have different ideas on how to solve climate change 
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
      .expectedSolutions=${2}>
    </vote-form>
  `
  render(voteFormTemplate, document.querySelector('#form-wrapper'))
}

const pendingNotice = html`
  <p id="pending-notice">
    Your vote has been successfully registered. Rock & roll! Your university is not currently listed on our website but we will add it shortly and send you an update. Thanks!
  </p>
`

function renderVotes (stats, preview = true, step = true) {
  const pageTemplate = html`
    <div>
      ${ step ? html`<div class="step">3</div>` : '' }
      <h3>Find out how your opinion relates to the community's</h3>
      ${ stats.country ?
         stats.country.map(country => countryShortTemplate(country)) :
         countryShortTemplate(stats, preview) }
      ${ stats.vote && stats.vote[0].pending ? pendingNotice : '' }
    </div>
  `
  render(pageTemplate, document.querySelector('#voters'))
}

function renderMyVote (stats) {
  const pageTemplate = html`
    <div>
      ${ countryShortTemplate(stats, false) }
      ${ stats.vote && stats.vote[0].pending ? pendingNotice : '' }
    </div>
  `
  render(pageTemplate, document.querySelector('#my-vote'))
}


function countryShortTemplate (country, preview = true) {
  return html`<opinions-box .country=${country} ?preview=${preview}></opinions-box>`
}
