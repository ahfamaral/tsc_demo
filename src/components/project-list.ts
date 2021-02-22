import Component from './base-component.js'
import { DragTarget } from '../models/dragdrop-interfaces.js'
import { Project, ProjectStatus } from '../models/project.js'
import { projectState } from '../models/project-state.js'
import autobind from '../decorators/autobind.js'

import ProjectItem from '../components/project-item.js'

// ProjectList Class
export default class ProjectList extends Component<HTMLDivElement, HTMLElement>
  implements DragTarget {
  assignedProjects: Project[];

  constructor(private type: 'active' | 'finished') {
    super('project-list', 'app', false, `${type}-projects`);
    
    this.assignedProjects = [];

    this.configure();

    this.renderContent();
  }

  @autobind
  dragOverHandler(event: DragEvent) {
    if (
      event.dataTransfer &&
      event.dataTransfer.types[0] === 'text/plain'
    ) {
      event.preventDefault();
      const listEl = this.newElement.querySelector('ul')!;
      listEl.classList.add('droppable');
    }
  }

  @autobind
  dropHandler(event: DragEvent) {
    const projectId = event.dataTransfer!.getData('text/plain')
    projectState.moveProject(
      projectId,
      this.type === 'active' ?
        ProjectStatus.Active : ProjectStatus.Finished
    )
  }

  @autobind
  dragLeaveHandler(_: DragEvent) {
    const listEl = this.newElement.querySelector('ul')!;
    listEl.classList.remove('droppable');
  }

  configure() {
    this.newElement.addEventListener('dragover', this.dragOverHandler);
    this.newElement.addEventListener('dragleave', this.dragLeaveHandler);
    this.newElement.addEventListener('drop', this.dropHandler);

    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter(project => {
        if (this.type === 'active') {
          return project.status === ProjectStatus.Active
        }

        return project.status === ProjectStatus.Finished
        
      });
      this.assignedProjects = relevantProjects;
      this.renderProjects()
    })
  }

  renderContent() {
    const listId = `${this.type}-projects-list`;
    this.newElement.querySelector('ul')!.id = listId;
    this.newElement.querySelector('h2')!.textContent = 
      this.type.toUpperCase() + ' PROJECTS'
  }

  private renderProjects() {
    const listEl = document.getElementById(
      `${this.type}-projects-list`
    ) as HTMLUListElement;
    listEl.innerHTML = '';
    this.assignedProjects.forEach((project) => {
      new ProjectItem(this.newElement.querySelector('ul')!.id, project);
    })
  }

}
