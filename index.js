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


async function handleRouting (location, event) {
  if (event && event.type === 'click') {
    window.scrollTo(0, 0)
  }
  const contentElements = CONTENT_ELEMENT_IDS.map(id => document.querySelector(`#${id}`))
  const legalElements = LEGAL_ELEMENT_IDS.map(id => document.querySelector(`#${id}`))
  for (const element of contentElements) element.classList.remove('inactive')
  for (const element of legalElements) element.classList.add('inactive')
  if (location.pathname === '/') {
    // TODO generic main page
    renderCfa(stats.global)
    renderVoteForm(solutions, stats.global)
    renderVotes(stats)
  } else {
    const slug = location.pathname.split('/')[1]
    if (universities.find(u => u.slug === slug)) {
      let country = stats.country.find(c => c.code === slug)
      renderCfa(country)
      renderVoteForm(solutions, country) 
      renderVotes(country)
      // TODO use lit-html until directive https://lit-html.polymer-project.org/guide/template-reference#until
      const countryResponse = await fetch(`${config.serviceUrl}/countries/${slug}`)
      country = await countryResponse.json()
      renderVotes(country, false)
    } else if (slug.match(/^[a-fA-F0-9]{24}$/)) {
      // TODO: render my vote
      const myVoteResponse = await fetch(`${config.serviceUrl}/votes/${slug}`)
      const myVote = await myVoteResponse.json()
      let country = stats.country.find(c => c.code === myVote.university)
      if (!country) country = {}
      country.vote = [myVote]
      renderVotes(country)
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

function renderCfa (context) {
  const university = universities.find(u => u.slug === context.code)
  const template = html`
    ${university ? `${university.name} students` : 'Students'}
    have different ideas on how to solve climate change 
  `
  render(template, document.querySelector('#cfa'))
}

function renderVoteForm (solutions, context) {
  const university = universities.find(u => u.slug === context.code)
  const solutionsHeader = html`
      <div class="step">1</div>
      <h3>
        Choose two solutions you want
        ${university ? university.name : 'your university'}
        to implement
      </h3>
  `

  const voteFormTemplate = html`
    ${solutionsHeader}
    <vote-form 
      .solutions=${solutions}
      .results=${context.result}
      .expectedSolutions=${2}>
    </vote-form>
  `
  render(voteFormTemplate, document.querySelector('#form-wrapper'))
}

function renderVotes (stats, preview = true) {
  const pageTemplate = html`
    <div>
      <div id="my-vote"></div>
      <div class="step">3</div>
      <h3>Find out how your opinion relates to the community's</h3>
      ${ stats.country ?
         stats.country.map(country => countryShortTemplate(country)) :
         countryShortTemplate(stats, preview) }
    </div>
  `
  render(pageTemplate, document.querySelector('#voters'))
}


function countryShortTemplate (country, preview = true) {
  return html`<opinions-box .country=${country} ?preview=${preview}></opinions-box>`
}
