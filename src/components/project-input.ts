namespace App {
  // ProjectInput Class
  export class ProjectInput extends Component<HTMLDivElement, HTMLFormElement>{
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
}