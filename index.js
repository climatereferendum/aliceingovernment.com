import { html, render } from 'lit-html'
import { installRouter } from './node_modules/pwa-helpers/router.js'

import { solutions } from '@aliceingovernment/data'
import config from './config'
import { VoteForm } from './vote-form'
import { OpinionBox } from './opinions-box'

const { fetch, FormData } = window

let active, slug
let myVote
const cache = []

document.addEventListener('DOMContentLoaded', async () => {
  renderVoteForm(solutions)
  installRouter(handleRouting)
  if (window.location.pathname.split('/')[1] === 'voters') {
    const myVoteId = window.location.pathname.split('/')[2]
    if (myVoteId) {
      const myVoteResponse = await fetch(`${config.serviceUrl}/votes/${myVoteId}`)
      myVote = await myVoteResponse.json()
    }
  }
  const statsResponse = await fetch(`${config.serviceUrl}`, { credentials: 'include' })
  const stats = await statsResponse.json()
  const countries = stats.country
  document.querySelector('vote-form').results = stats.global.result
  renderVotes(stats)
  handleRouting(window.location)
  for await (const country of countries) {
    await new Promise(resolve => setTimeout(resolve))
    const element = document.querySelector(`#voters-${country.code}`)
    render(countryShortTemplate(country), element)
  }

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


// detect vote URL with /^[a-fA-F0-9]{24}$/
async function handleRouting (location, event) {
  if (event && event.type === 'click') {
    window.scrollTo(0, 0)
  }
  active = location.pathname.split('/')[1]
  slug = location.pathname.split('/')[2]
  let linkedHeader = true
  if (active === '') {
    document.querySelector('#home').classList.remove('inactive')
    linkedHeader = false
  } else {
    document.querySelector(`#${active}`).classList.remove('inactive')
  }
  renderHeader(linkedHeader)
  if (active === 'voters') {
    if (slug) {
      // const template = html`
      //   <div class="my-vote">Congratulations, you are voter from <strong>${countryName(myVote.nationality)}</strong></div>
      //   <div class="vertical-line-small"></div>
      //   ${countryShortTemplate({ code: myVote.nationality, vote: [myVote] })}
      // `
      // if (document.querySelector('#my-vote')) {
      //   render(template, document.querySelector('#my-vote'))
      // }
    } else {
      if (document.querySelector('#my-vote')) {
        document.querySelector('#my-vote').classList.add('inactive')
      }
    }
  }
  if (active === 'countries' && slug) {
    let country = cache.find(c => c.code === slug)
    if (!country) {
      const countryResponse = await fetch(`${config.serviceUrl}/countries/${slug}`)
      country = await countryResponse.json()
      cache.push(country)
    }
    if (active !== 'countries') return // check again if route didn't change
    // renderCountry(country)
    document.querySelector('#country').classList.remove('inactive')
  }
}

function renderHeader (linked = true) {
  let headerTemplate = html`
    Alice in Government
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

function renderVoteForm (solutions) {
  const solutionsHeader = html`
      <div class="step">1</div>
      <h3>
        Choose two solutions you want your university to implement
      </h3>
  `

  const voteFormTemplate = html`
    ${solutionsHeader}
    <vote-form 
      .solutions=${solutions}
      .expectedSolutions=${2}>
    </vote-form>
  `
  render(voteFormTemplate, document.querySelector('#form-wrapper'))
}

function renderVotes (stats) {
  const pageTemplate = html`
    <div>
      <div id="my-vote"></div>
      <div class="step">3</div>
      <h3>Find out how your opinion relates to the cummunity's</h3>
      ${stats.country.map(c => html`<div id="voters-${c.code}"></div>`)}
    </div>
  `
  render(pageTemplate, document.querySelector('#voters'))
}


function countryShortTemplate (country) {
  return html`<opinions-box .country=${country} preview></opinions-box>`
}
