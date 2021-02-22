namespace App {

  export class ProjectItem extends Component<HTMLUListElement, HTMLLIElement>
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

}