import { html, render } from 'lit-html'
import { installRouter } from '../node_modules/pwa-helpers/router.js'
import csv from 'neat-csv'

const DOC_URL = 'https://docs.google.com/spreadsheets/d/1WNDWjJOGeVbOsYaWy3udBnRxFIknO5NpYwToVhH2nGE/gviz/tq?tqx=out:csv'
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

function handleRouting (location) {
  for (const page of pages) {
    page.classList.add('inactive')
  }
  const active = location.pathname.split('/')[1]
  const slug = location.pathname.split('/')[2]
  if (active === '') {
    document.querySelector('#home').classList.remove('inactive')
  }
  if (active === 'solutions' && !slug) {
    document.querySelector('#solutions').classList.remove('inactive')
  }
  if (active === 'solutions' && slug) {
    const solution = solutions.find(solution => solution.slug === slug)
    renderProjects(solution)
    document.querySelector('#projects').classList.remove('inactive')
  }
}

function itemTemplate (solution) {
  return html`
    <div class="project-box col-xs-6">
        <a href="/solutions/${solution.slug}">
        <h4>Solution #${solution.rank}</h4>
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
          ${itemTemplate(pair[0])}
          <div class="hor-line"></div>
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
        <img src="https://raw.githubusercontent.com/elf-pavlik/blockchainvsclimatechange.com/gh-pages/img/projects/${project.slug}.jpg" class="img-responsive">              
    </div>
    
    <div class="project-box solution">                   
        <p>${project.description}</p>
        
        <a href="/projects/{project.slug}"><i>read more →</i></a>
        
        <a href=""><div class="vote">Vote</div></a>
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
