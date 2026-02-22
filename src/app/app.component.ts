import { Component } from '@angular/core';
import { JsonPipe } from '@angular/common';
import {
  UiButtonComponent,
  UiFormBuilderComponent,
  UiFormSchema,
  UiFormData,
  UiFormValidationState,
} from '@gnggln/ng-ui-system';

// ─── Demo Form Schema ────────────────────────────────────────────
const DEMO_SCHEMA: UiFormSchema = {
  id: 'starter-demo',
  title: 'Demo Form',
  description: 'Esempio di form generato con @links/ng-ui-system.',
  sections: [
    {
      id: 'anagrafica',
      title: 'Anagrafica',
      fields: [
        { key: 'nome', type: 'text', label: 'Nome', required: true,
          validation: [{ type: 'required', message: 'Il nome è obbligatorio' }],
          layout: { columns: 6 } },
        { key: 'cognome', type: 'text', label: 'Cognome', required: true,
          validation: [{ type: 'required', message: 'Il cognome è obbligatorio' }],
          layout: { columns: 6 } },
        { key: 'email', type: 'email', label: 'Email',
          validation: [
            { type: 'required', message: 'Email obbligatoria' },
            { type: 'email', message: 'Formato email non valido' },
          ],
          layout: { columns: 6 } },
        { key: 'telefono', type: 'text', label: 'Telefono',
          validation: [
            { type: 'pattern', value: '^(\\+39)?\\s?3[0-9]{2}\\s?[0-9]{6,7}$', message: 'Formato: +39 3XX XXXXXXX' },
          ],
          placeholder: '+39 333 1234567',
          layout: { columns: 6 } },
      ],
    },
    {
      id: 'dettagli',
      title: 'Dettagli',
      fields: [
        {
          key: 'ruolo', type: 'select', label: 'Ruolo',
          options: [
            { value: 'dev', label: 'Sviluppatore' },
            { value: 'designer', label: 'Designer' },
            { value: 'pm', label: 'Project Manager' },
            { value: 'qa', label: 'QA Engineer' },
          ],
          layout: { columns: 6 },
        },
        { key: 'esperienza', type: 'number', label: 'Anni di esperienza',
          validation: [
            { type: 'min', value: 0, message: 'Non può essere negativo' },
            { type: 'max', value: 50, message: 'Valore massimo 50' },
          ],
          layout: { columns: 6 } },
        {
          key: 'competenze', type: 'multiselect', label: 'Competenze',
          allowSelectAll: true,
          options: [
            { value: 'angular', label: 'Angular' },
            { value: 'react', label: 'React' },
            { value: 'vue', label: 'Vue' },
            { value: 'node', label: 'Node.js' },
            { value: 'python', label: 'Python' },
          ],
          layout: { columns: 12 },
        },
        { key: 'data-inizio', type: 'date', label: 'Data di inizio',
          layout: { columns: 6 } },
        {
          key: 'newsletter', type: 'checkbox', label: 'Iscrizione alla newsletter',
          appearance: { style: 'switch' },
          layout: { columns: 6 },
        },
        { key: 'note', type: 'textarea', label: 'Note aggiuntive',
          placeholder: 'Inserisci eventuali note...',
          validation: [{ type: 'maxLength', value: 500, message: 'Massimo 500 caratteri' }],
          layout: { columns: 12 } },
      ],
    },
  ],
  config: {
    columns: 12,
    showButtons: true,
    buttonLabels: { submit: 'Invia', reset: 'Annulla' },
  },
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UiButtonComponent, UiFormBuilderComponent, JsonPipe],
  template: `
    <main class="app-main">
      <header class="app-header">
        <h1>ng-starter</h1>
        <p>Template pre-configurato con <strong>&#64;links/ng-ui-system</strong></p>
      </header>

      <!-- Button Demo -->
      <section class="demo-section">
        <h2>Button</h2>
        <div class="button-row">
          <ui-button label="Primary" variant="primary"></ui-button>
          <ui-button label="Accent" variant="accent"></ui-button>
          <ui-button label="Outline" variant="outline"></ui-button>
          <ui-button label="Ghost" variant="ghost"></ui-button>
          <ui-button label="Warn" variant="warn"></ui-button>
        </div>
      </section>

      <!-- Form Builder Demo -->
      <section class="demo-section">
        <h2>Form Builder</h2>
        <ui-form-builder
          [schema]="schema"
          [initialData]="initialData"
          (formSubmit)="onSubmit($event)"
          (valueChange)="onValueChange($event)"
          (validationChange)="onValidationChange($event)"
        />
      </section>

      <!-- Output -->
      @if (lastSubmit) {
        <section class="demo-section output-section">
          <h2>Ultimo Submit</h2>
          <pre class="output-json">{{ lastSubmit | json }}</pre>
        </section>
      }
    </main>
  `,
  styles: [`
    .app-main {
      max-width: 960px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
    .app-header {
      margin-bottom: 2.5rem;
      text-align: center;
    }
    .app-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--ui-color-primary);
      margin: 0 0 0.5rem;
    }
    .app-header p {
      color: var(--ui-color-text-secondary);
      margin: 0;
    }
    .demo-section {
      background: var(--ui-color-surface);
      border: 1px solid var(--ui-color-border);
      border-radius: var(--ui-radius-lg);
      padding: 2rem;
      margin-bottom: 1.5rem;
    }
    .demo-section h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1.5rem;
      color: var(--ui-color-text);
    }
    .button-row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .output-section {
      background: var(--ui-color-bg-muted);
    }
    .output-json {
      background: #1e293b;
      color: #e2e8f0;
      padding: 1rem;
      border-radius: var(--ui-radius-md);
      font-size: 0.75rem;
      overflow-x: auto;
      max-height: 300px;
      line-height: 1.4;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }
  `],
})
export class AppComponent {
  schema = DEMO_SCHEMA;
  initialData: UiFormData = { nome: 'Mario', cognome: 'Rossi', email: 'mario.rossi@example.it' };

  lastSubmit: UiFormData | null = null;
  lastValidation: UiFormValidationState | null = null;

  onSubmit(data: UiFormData): void {
    this.lastSubmit = data;
    console.log('[ng-starter] Form submitted:', data);
  }

  onValueChange(data: UiFormData): void {
    // Live value tracking (optional)
  }

  onValidationChange(state: UiFormValidationState): void {
    this.lastValidation = state;
  }
}
