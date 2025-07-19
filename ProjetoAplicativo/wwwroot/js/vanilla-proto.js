// FILE: EditaRoteiro.js (Modern Vanilla JS Version)
const EditaRoteiro = (() => {
    // Constants
    const MAX_PERSONAGEM_SELECTS = 10;
    const URLS = {
        CREATE: '/Roteiros/CreateInstrucao',
        EDIT: '/Roteiros/EditInstrucao',
        INSERT: '/Roteiros/InsertInstrucao',
        DELETE: '/Roteiros/DeletaInstrucao',
        MOVE_UP: '/Roteiros/MoveInstructionUp',
        MOVE_DOWN: '/Roteiros/MoveInstructionDown',
        MENTIONS: '/Roteiros/GetPersonagensForMentions'
    };

    // State
    const state = {
        modo: 'idle',
        referenceRowId: 0,
        update(newModo, newReferenceRowId) {
            this.modo = newModo;
            this.referenceRowId = newReferenceRowId;
            document.getElementById('formState').dataset.modo = newModo;
            document.getElementById('formState').dataset.rowid = newReferenceRowId;
        }
    };

    // DOM Helpers
    const $ = (selector, el = document) => el.querySelector(selector);
    const $$ = (selector, el = document) => el.querySelectorAll(selector);
    const createElement = (tag, attrs = {}) => Object.assign(document.createElement(tag), attrs);

    // Core Functions
    function setFormState(modo, referenceRowId) {
        const { modo: currentModo, referenceRowId: currentRowId } = state;
        const referenceRow = $(`tr[data-id="${referenceRowId}"]`);

        // Cleanup previous state
        if (currentModo === 'edit' && currentRowId !== referenceRowId) {
            $(`tr[data-id="${currentRowId}"]`).style.display = '';
        }
        document.querySelectorAll('.form-container, #formFeedback').forEach(el => el.remove());

        if (modo === 'idle') {
            $('#showForm').style.display = '';
            state.update('idle', 0);
            return;
        }

        // Create new form
        const formContainer = createElement('tr', { className: 'form-container' });
        formContainer.innerHTML = `<td colspan="3">${$('#formTemplate').innerHTML}</td>`;

        // Position form
        const table = $('.tabela');
        if (modo === 'create') {
            $('#showForm').style.display = 'none';
            table.appendChild(formContainer);
        } else {
            $('#showForm').style.display = '';
            referenceRow[modo === 'above' ? 'before' : 'after'](formContainer);
            if (modo === 'edit') referenceRow.style.display = 'none';
        }

        // Initialize components
        initPersonagemHandlers(modo === 'edit');
        initMentions();
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Form cancel handler
        $('#cancelaForm').onclick = () => setFormState('idle', 0);
        state.update(modo, referenceRowId);
    }

    function initMentions() {
        const tribute = new Tribute({
            trigger: '@',
            lookup: 'nome',
            fillAttr: 'nome',
            menuItemTemplate: item => item.original.nome,
            selectTemplate: item => `@[${item.original.id}|${item.original.nome}]`,
            menuItemHighlightClass: 'highlighted'
        });

        const textarea = $('#textoInstrucao');
        tribute.attach(textarea);

        fetch(`${URLS.MENTIONS}?cenaId=${currentCenaId}`)
            .then(r => r.json())
            .then(data => tribute.append(0, data));
    }

    function initPersonagemHandlers(isEditMode) {
        const container = $('#dynamicPersonagemContainer');
        container.innerHTML = isEditMode ? $('#personagemSelectTemplate').innerHTML : '';

        $('#addPersonagem').onclick = () => {
            if ($$('[name="personagemIds[]"]').length < MAX_PERSONAGEM_SELECTS) {
                container.insertAdjacentHTML('beforeend', $('#personagemSelectTemplate').innerHTML);
            }
        };

        container.addEventListener('click', e => {
            if (e.target.classList.contains('remove-personagem')) {
                if ($$('[name="personagemIds[]"]').length > 1) {
                    e.target.closest('.personagem-select-group').remove();
                }
            }
        });

        container.addEventListener('change', e => {
            if (e.target.classList.contains('personagem-select')) {
                const selects = $$('[name="personagemIds[]"]');
                const showAddButton = !selects.some(s => s.value === "-1") && selects.length < MAX_PERSONAGEM_SELECTS;
                $('#addPersonagem').style.display = showAddButton ? '' : 'none';
            }
        });
    }

    function handleFormSubmit(url, successCallback) {
        return async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const params = new URLSearchParams(formData);

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').value
                    },
                    body: params
                });
                const data = await response.json();

                if (data.success) {
                    successCallback(data);
                } else {
                    feedbackMessage('erro', data.error);
                }
            } catch (error) {
                feedbackMessage('erro', error.message);
            }
        };
    }

    function feedbackMessage(status, message) {
        const messages = {
            create: m => `Instrução ${m} criada com sucesso`,
            edit: m => `Instrução ${m} atualizada com sucesso`,
            above: m => `Instrução ${m} inserida acima com sucesso`,
            below: m => `Instrução ${m} inserida abaixo com sucesso`,
            erro: m => `Erro: ${m}`
        };

        const alert = createElement('div', {
            className: `alert ${status === 'erro' ? 'alert-danger' : 'alert-success'}`,
            textContent: messages[status]?.(message) || messages.erro(message)
        });

        const container = $('#formFeedback');
        container.innerHTML = '';
        container.appendChild(alert);
        container.style.display = 'none';
        setTimeout(() => {
            container.style.display = '';
            setTimeout(() => container.style.display = 'none', 2000);
        }, 10);
    }

    // Event Bindings
    function initEventListeners() {
        // Create
        $('#showForm').addEventListener('click', () => {
            setFormState('create', 0);
            $('#instrucaoForm').onsubmit = handleFormSubmit(URLS.CREATE, response => {
                const newRow = createElement('tr', { innerHTML: response.html });
                $('.tabela').appendChild(newRow);
                $('#instrucaoForm').reset();
                feedbackMessage('create', '');
            });
        });

        // Edit
        document.addEventListener('click', e => {
            if (e.target.classList.contains('edit-instruction')) {
                const id = e.target.dataset.id;
                fetch(`${URLS.EDIT}/${id}`)
                    .then(r => r.json())
                    .then(dados => {
                        setFormState('edit', id);
                        const form = $('#instrucaoForm');
                        form.querySelector('[name="CenaId"]').value = dados.cenaId;
                        form.querySelector('[name="TipoDeInstrucao"]').value = dados.tipo;
                        form.querySelector('[name="Texto"]').value = dados.texto;

                        form.onsubmit = handleFormSubmit(URLS.EDIT, () => {
                            $(`tr[data-id="${id}"]`).remove();
                            setFormState('idle', 0);
                            feedbackMessage('edit', dados.ordem);
                        });
                    });
            }
        });

        // Insert (Above/Below)
        document.addEventListener('click', e => {
            if (e.target.classList.contains('insert-above') || e.target.classList.contains('insert-below')) {
                const position = e.target.classList.contains('insert-above') ? 'above' : 'below';
                const referenceId = e.target.dataset.id;
                setFormState(position, referenceId);

                const form = $('#instrucaoForm');
                form.onsubmit = handleFormSubmit(URLS.INSERT, () => {
                    setFormState('idle', 0);
                    updateOrderNumbers();
                    feedbackMessage(position, '');
                });
            }
        });

        // Delete
        document.addEventListener('click', async e => {
            if (e.target.classList.contains('delete-instruction') && confirm('Tem certeza?')) {
                const row = e.target.closest('tr');
                const id = e.target.dataset.id;

                try {
                    const response = await fetch(URLS.DELETE, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'RequestVerificationToken': $('meta[name="__RequestVerificationToken"]').content
                        },
                        body: JSON.stringify({ id })
                    });
                    const data = await response.json();

                    if (data.success) {
                        row.remove();
                        updateOrderNumbers();
                    } else {
                        alert('Erro: ' + data.message);
                    }
                } catch (error) {
                    alert('Erro: ' + error.message);
                }
            }
        });

        // Move Up/Down
        document.addEventListener('click', e => {
            if (e.target.classList.contains('move-up') || e.target.classList.contains('move-down')) {
                const direction = e.target.classList.contains('move-up') ? 'up' : 'down';
                const id = e.target.dataset.id;
                moveInstruction(id, direction);
            }
        });
    }

    // Initialize
    function init() {
        initEventListeners();
    }

    return { init };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => EditaRoteiro.init());