import { html, render } from 'lit-html'
import { installRouter } from './node_modules/pwa-helpers/router.js'

import { solutions, universities } from '@aliceingovernment/data'
import config from './config'
import { VoteForm } from './vote-form'
import { OpinionBox } from './opinions-box'

const { fetch } = window

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
  if (location.pathname === '/') {
    // TODO generic main page
    renderCfa(stats.global)
    renderVoteForm(solutions, stats.global)
    renderVotes(stats)
  } else {
    const slug = location.pathname.split('/')[1]
    if (universities.find(u => u.slug === slug)) {
      const country = stats.country.find(c => c.code === slug)
      renderCfa(country)
      renderVoteForm(solutions, country) 
      renderVotes(country)
      // TODO university specific page
      // let country = cache.find(c => c.code === slug)
      // const countryResponse = await fetch(`${config.serviceUrl}/countries/${slug}`)
      // country = await countryResponse.json()
      // cache.push(country)
      // TODO use lit-html until directive https://lit-html.polymer-project.org/guide/template-reference#until
    } else if (slug.match(/^[a-fA-F0-9]{24}$/)) {
      // TODO: render my vote
      // const myVoteResponse = await fetch(`${config.serviceUrl}/votes/${myVoteId}`)
      // const myVote = await myVoteResponse.json()
      // const template = html`
      //   <div class="my-vote">Congratulations, you are voter from <strong>${countryName(myVote.nationality)}</strong></div>
      //   <div class="vertical-line-small"></div>
      //   ${countryShortTemplate({ code: myVote.nationality, vote: [myVote] })}
      // `
      // if (document.querySelector('#my-vote')) {
      //   render(template, document.querySelector('#my-vote'))
      // }
    } else if (slug === 'privacy-policy' || slug === 'terms-of-service') {
      // TODO show privacy policy or terms of service
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

function renderVotes (stats) {
  const pageTemplate = html`
    <div>
      <div id="my-vote"></div>
      <div class="step">3</div>
      <h3>Find out how your opinion relates to the cummunity's</h3>
      ${ stats.country ?
         stats.country.map(country => countryShortTemplate(country)) :
         countryShortTemplate(stats) }
    </div>
  `
  render(pageTemplate, document.querySelector('#voters'))
}


function countryShortTemplate (country) {
  return html`<opinions-box .country=${country} preview></opinions-box>`
}
