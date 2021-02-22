// Drag & Drop Interfaces
interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
}

// Project Type
enum ProjectStatus {
  Active,
  Finished
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {

  }
}

type Listener<T> = (projects: T[]) => void;

class State<T> {
  protected listeners: Listener<T>[] = [];

  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn);
  }

}


// Project State Management
class ProjectState extends State<Project> {
  private projects: Project[] = [];
  private static instance: ProjectState;

  private constructor() {
    super()
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }

  addProject(title:string, description: string, people: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      people,
      ProjectStatus.Active,
    );
    this.projects.push(newProject);
    this.updateListeners();
  }

  moveProject(projectId: string, newStatus: ProjectStatus) {
    const project = this.projects.find(prj => prj.id === projectId)

    if (project && project.status !== newStatus) {
      project.status = newStatus;
      this.updateListeners();
    }
  }

  private updateListeners() {
    this.listeners.forEach(listenerFn => {
      listenerFn(this.projects.slice());
    });
  }
}

const projectState = ProjectState.getInstance();

// Validation
interface Validatable {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

function validate(input: Validatable) {
  let isValid = true;

  if (input.required) {
    isValid = isValid &&
      input.value.toString().trim().length !== 0;
  }

  if (
    input.minLength != null &&
    typeof input.value === 'string'
  ) {
    isValid = isValid &&
      input.value.toString().length >= input.minLength; 
  }

  if (
    input.maxLength != null &&
    typeof input.value === 'string'
  ) {
    isValid = isValid &&
      input.value.toString().length <= input.maxLength; 
  }

  if (
    input.min != null &&
    typeof input.value === 'number'
  ) {
    isValid = isValid && input.value >= input.min;
  }

  if (
    input.max != null &&
    typeof input.value === 'number'
  ) {
    isValid = isValid && input.value <= input.max;
  }

  return isValid;
}

// autobind decorator
function autobind(
  _: any,
  _2: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    }
  }

  return adjDescriptor;
}

// Component Base Class
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: T;
  newElement: U;

  constructor(
    templateId: string,
    hostElementId: string,
    insertAtStart: boolean,
    newElementId?: string,
  ) {
    this.templateElement = document.getElementById(
      templateId
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostElementId)! as T;
    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.newElement = importedNode.firstElementChild as U;
    if (newElementId) {
      this.newElement.id = newElementId;  
    }

    this.attach(insertAtStart)
  }

  private attach(insertAtBeginning: boolean) {
    this.hostElement.insertAdjacentElement(
      insertAtBeginning ? 'afterbegin' : 'beforeend',
      this.newElement
    );
  };

  abstract configure() : void;
  abstract renderContent(): void;
}

class ProjectItem extends Component<HTMLUListElement, HTMLLIElement>
  implements Draggable {
  private project: Project;

  get persons() {
    if (this.project.people === 1) {
      return '1 person';
    } else {
      return `${this.project.people} persons`
    }
  }
  
  constructor(hostId: string, project: Project) {
    super('single-project', hostId, false, project.id);
    this.project = project

    this.configure();
    this.renderContent();
  }

  @autobind
  dragStartHandler(event: DragEvent) {
    event.dataTransfer!.setData('text/plain', this.project.id);
    event.dataTransfer!.effectAllowed = 'move';
  }

  dragEndHandler(_: DragEvent) {
    console.log('DragEnd')
  }

  configure() {
    this.newElement.addEventListener('dragstart', this.dragStartHandler);
  }

  renderContent() {
    this.newElement.querySelector(
      'h2'
    )!.textContent = this.project.title;

    this.newElement.querySelector(
      'h3'
    )!.textContent = this.persons + ' assigned';

    this.newElement.querySelector(
      'p'
    )!.textContent = this.project.description;
    
  }
}

// ProjectList Class
class ProjectList extends Component<HTMLDivElement, HTMLElement>
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

// ProjectInput Class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement>{
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    super('project-input', 'app', true, 'user-input')

    this.titleInputElement = this.newElement.querySelector(
      '#title'
    ) as HTMLInputElement;
    this.descriptionInputElement = this.newElement.querySelector(
      '#description'
    ) as HTMLInputElement;
    this.peopleInputElement = this.newElement.querySelector(
      '#people'
    ) as HTMLInputElement;

    this.configure();
  }

  configure() {  
    this.newElement.addEventListener('submit', this.submitHandler);
  }

  renderContent() {}

  private gatherUserInput(): [string, string, number] | void {

    const title = this.titleInputElement.value;

    const description = this.descriptionInputElement.value;

    const people = this.peopleInputElement.value;

    const validatableTitle: Validatable = {
      value: title,
      required: true,
      minLength: 2
    }
    const validatableDescription: Validatable = {
      value: description,
      required: true,
      minLength: 5
    }
    const validatablePeople: Validatable = {
      value: +people,
      required: true,
      min: 1,
      max: 5
    }
    if (
      !validate(validatableTitle) ||
      !validate(validatableDescription) ||
      !validate(validatablePeople)
    ) {
      alert('Invalid input, please try again!');
      return ;
    }

    return [title, description, +people]
  }

  private clearInputs() {
    this.titleInputElement.value = '';
    this.descriptionInputElement.value = '';
    this.peopleInputElement.value = '';
  }

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      const [title, description, people] = userInput
      projectState.addProject(title, description, people)
      this.clearInputs();
    }
  }
}

const pInput1 = new ProjectInput();
const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished');