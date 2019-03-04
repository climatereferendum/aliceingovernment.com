import { html, render } from 'lit-html'
import { installRouter } from './node_modules/pwa-helpers/router.js'
import csv from 'neat-csv'
import { flag } from 'country-emoji'

const DOC_URL = 'https://docs.google.com/spreadsheets/d/1WNDWjJOGeVbOsYaWy3udBnRxFIknO5NpYwToVhH2nGE/gviz/tq?tqx=out:csv'
const BANNER_BASE = 'https://raw.githubusercontent.com/elf-pavlik/bvcc-banners/master'
let solutions
let projects
let votes, votesCount

;(async () => {
  const solutionsResponse = await window.fetch(DOC_URL + '&sheet=solutions')
  const solutionsCsv = await solutionsResponse.text()
  solutions = await csv(solutionsCsv)
  renderSolutions(solutions)
  const projectsResponse = await window.fetch(DOC_URL + '&sheet=projects')
  const projectsCsv = await projectsResponse.text()
  projects = await csv(projectsCsv)
  installRouter(handleRouting)
})()

const pages = document.querySelectorAll('.page')

async function handleRouting (location, event) {
  if (event && event.type === 'click') {
    window.scrollTo(0, 0)
  }
  for (const page of pages) {
    page.classList.add('inactive')
  }
  const active = location.pathname.split('/')[1]
  const slug = location.pathname.split('/')[2]
  let linkedHeader = true
  if (active === '') {
    document.querySelector('#home').classList.remove('inactive')
    linkedHeader = false
  }
  if (active === 'info') {
    document.querySelector('#info').classList.remove('inactive')
  }
  if (active === 'solutions' && !slug) {
    document.querySelector('#solutions').classList.remove('inactive')
  }
  if (active === 'solutions' && slug) {
    const solution = solutions.find(solution => solution.slug === slug)
    renderProjects(solution)
    document.querySelector('#projects').classList.remove('inactive')
  }
  if (active === 'projects' && slug) {
    const project = projects.find(project => project.slug === slug)
    renderProfile(project)
    document.querySelector('#profile').classList.remove('inactive')
  }
  if (active === 'votes' && !slug) {
    if (!votes) [votes, votesCount] = await fetchVotes()
    renderVotes(votes)
    document.querySelector('#votes').classList.remove('inactive')
  }
  if (active === 'votes' && slug) {
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

function itemTemplate (solution) {
  return html`
    <div class="project-box col-xs-6">
        <a href="/solutions/${solution.slug}">
        <span>${solution['vote counter']}</span>
        <h4>Solution #${solution.rank}</h4>
        <h3>${solution.name}</h3></a>
    </div>
  `
}

function verticalLineTemplate (idx) {
  if (idx === 0) return
  if (idx % 2 === 1) {
    return html`<div class="vert-right-line"></div>`
  } else {
    return html`<div class="vert-left-line"></div>`
  }
}

function decorationTemplate (row, side) {
  if (row === 0) return
  if (row % 2 === 1 && side === 'left') {
    let group = (row * 2) % 3 === 0 ? 3 : 1
    return html`<img src="/img/m/group_${group}.png" class="group${group}">`
  }
  if (row % 2 === 0 && side === 'right') {
    let group = 2
    return html`<img src="/img/m/group_${group}.png" class="group${group}">`
  }
}

function renderSolutions (solutions) {
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

  const solutionsHeader = html`
    <h2 class="h-boxed" style="text-align:left;">To make things easier, here is a list of the<br> 
      Top 30 most effective Solutions<br> 
      to Climate Change as compiled by the <br>
      wonderful team of scientists at <a href="https://www.drawdown.org/" target="_blank">Drawdown</a></h2>
    <div class="vertical-line"></div>
  `

  const solutionsTemplate = html`
    ${solutionsHeader}
    ${pairs.map((pair, idx) => {
      return html`
        ${verticalLineTemplate(idx)}
        <div class="row">
          ${decorationTemplate(idx, 'left')}
          ${itemTemplate(pair[0])}
          <div class="hor-line"></div>
          ${decorationTemplate(idx, 'right')}
          ${itemTemplate(pair[1])}
        </div>
      `
    })
  }`

  render(solutionsTemplate, document.querySelector('#solutions'))
}

function projectTemplate (project) {
  return html`
    <div class="vertical-line"></div>
    <div class="sol-image">
        <span>${project.name}</span>
        <img src="${BANNER_BASE}/${project.slug}.jpg" class="img-responsive">              
    </div>
    <div class="project-box solution">                   
        <p>${project.description}</p>
        <a href="/projects/${project.slug}"><i>read more →</i></a>
        <a href="/vote"><div class="vote">Vote</div></a>
    </div>
`
}

function renderProjects (solution) {
  const projectsForSolution = projects.filter(project => project.solution === solution.rank)
  const projectsTemplate = html`
    <div class="dot-crumbs">
      <a href="/solutions"><div class="crumb">← Back to Solutions</div></a>
    </div>
    <div class="vertical-line"></div>
    <div class="row">
        <div class="project-box solution">
            <h4>Solution #${solution.rank}</h4>
            <h3>${solution.name}</h3>
            <a href="${solution.link}">${solution.link}</a>
        </div>
        ${projectsForSolution.map(projectTemplate)}
  `
  render(projectsTemplate, document.querySelector('#projects'))
}

function renderProfile (project) {
  const solution = solutions.find(solution => solution.rank === project.solution)
  const profileTemplate = html`
    <div class="container">
    <div class="dot-crumbs">
        <a href="/solutions/${solution.slug}"><div class="crumb">← Back to Projects</div></a>
    </div>
    <div class="row">
      <div class="vertical-line"></div>
      <div class="project-image">
          <div class="project-category">
              <b>Solution ${solution.rank}</b><br>
              ${solution.name}
          </div>
          <span>${project.name}</span>
          <img src="${BANNER_BASE}/${project.slug}.jpg" class="img-responsive">              
      </div>
      <div class="project-box solution">
          <p><b>${project.name}</b>${project.description}</p>
          <p><b>Where they work:</b>${project['where they work']}</p>
          <a href="/vote"><div class="vote">Vote</div></a>
      </div>
    </div>
    </div>
  `
  render(profileTemplate, document.querySelector('#profile'))
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
          <a href="/votes/${country.toLowerCase()}">
            <h2>
              ${flag(country)}
              ${country}
            </h2>
            <span>${votes[country].length} VOTES</span>
          </a>
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
