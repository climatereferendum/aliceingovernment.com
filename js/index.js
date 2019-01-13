import { html, render } from 'lit-html'
import { installRouter } from '../node_modules/pwa-helpers/router.js'
import csv from 'neat-csv'

const DOC_URL = 'https://docs.google.com/spreadsheets/d/1WNDWjJOGeVbOsYaWy3udBnRxFIknO5NpYwToVhH2nGE/gviz/tq?tqx=out:csv'
const BANNER_BASE = 'https://raw.githubusercontent.com/elf-pavlik/bvcc-banners/master'
let solutions
let projects

;(async () => {
  const solutionsResponse = await window.fetch(DOC_URL + '&sheet=solutions')
  const solutionsCsv = await solutionsResponse.text()
  solutions = await csv(solutionsCsv)
  renderSolutions(solutions)
  window.data = {
    solutions
  }
  const projectsResponse = await window.fetch(DOC_URL + '&sheet=projects')
  const projectsCsv = await projectsResponse.text()
  projects = await csv(projectsCsv)
  window.data.projects = projects
  console.log('ok')

  installRouter(handleRouting)
})()

const pages = document.querySelectorAll('.page')

function handleRouting (location, event) {
  closeNav()
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
  renderHeader(linkedHeader)
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
    return html`<img src="img/m/group_${group}.png" class="group${group}">`
  }
  if (row % 2 === 0 && side === 'right') {
    let group = 2
    return html`<img src="img/m/group_${group}.png" class="group${group}">`
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

  const solutionsTemplate = html`${
    pairs.map((pair, idx) => {
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
    <div class="row" style="top: -44px;">
      <div class="dot-crumbs">
          <a href="/solutions/${solution.slug}"><div class="crumb">← Back to Overview</div></a>
      </div>
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
