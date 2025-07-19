// FILE: EditaRoteiro.ts

//#region -- Types and Interfaces
type FormMode = 'idle' | 'create' | 'above' | 'below' | 'edit';

interface ServerResponse {
    success: boolean;
    error?: string;
    html?: string;
    message?: string;
    swappedId?: number;
    newOrder?: number;
    swappedOrder?: number;
}

interface InstructionData {
    id: number;
    cenaId: number;
    tipo: string;
    texto: string;
    ordem: number;
    personagemIds?: number[];
    instrucoesPersonagens?: Array<{
        showAll?: boolean;
        showAllExcept?: boolean;
        personagemId?: number;
    }>;
}

interface Personagem {
    id: number;
    nome: string;
}
//#endregion

//#region -- State
let stateModo: FormMode = 'idle';
let stateReferenceRowId: number = 0;

function setFormState(modo: FormMode, referenceRowId: number): void {
    const currentModo = stateModo;
    const currentRowId = stateReferenceRowId;
    const referenceRow = document.querySelector(`tr[data-id="${referenceRowId}"]`) as HTMLElement;

    if (currentModo === 'edit' && currentRowId !== referenceRowId) {
        const previousRow = document.querySelector(`tr[data-id="${currentRowId}"]`) as HTMLElement;
        if (previousRow) previousRow.style.display = '';
    }

    document.querySelectorAll('.form-container').forEach(el => el.remove());
    const formFeedback = document.getElementById('formFeedback');
    if (formFeedback) formFeedback.innerHTML = '';

    if (modo !== 'idle') {
        const formContainer = document.createElement('tr');
        formContainer.className = 'form-container';
        formContainer.innerHTML = '<td colspan="3"></td>';

        const formTemplate = document.getElementById('formTemplate');
        if (formTemplate) {
            const td = formContainer.querySelector('td');
            if (td) td.innerHTML = formTemplate.innerHTML;
        }

        const showForm = document.getElementById('showForm');
        if (showForm) showForm.style.display = modo === 'create' ? 'none' : '';

        const tabela = document.querySelector('.tabela');
        if (!tabela) return;

        switch (modo) {
            case 'create':
                tabela.appendChild(formContainer);
                break;
            case 'above':
                referenceRow?.before(formContainer);
                break;
            case 'below':
                referenceRow?.after(formContainer);
                break;
            case 'edit':
                referenceRow?.after(formContainer);
                if (referenceRow) referenceRow.style.display = 'none';
                const dynamicContainer = document.getElementById('dynamicPersonagemContainer');
                const selectTemplate = document.getElementById('personagemSelectTemplate');
                if (dynamicContainer && selectTemplate) {
                    dynamicContainer.innerHTML = selectTemplate.innerHTML;
                } else {
                    resetToSingleSelect();
                }
                break;
        }

        initPersonagemHandlers();
        initMentions();

        formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const cancelButton = document.getElementById('cancelaForm');
        if (cancelButton) {
            cancelButton.onclick = () => setFormState('idle', 0);
        }
    } else {
        const showForm = document.getElementById('showForm');
        if (showForm) showForm.style.display = '';
    }

    updateFormState(modo, referenceRowId);
}

function updateFormState(newModo: FormMode, newReferenceRowId: number): void {
    stateModo = newModo;
    stateReferenceRowId = newReferenceRowId;
    const formState = document.getElementById('formState');
    if (formState) {
        formState.dataset.modo = newModo;
        formState.dataset.rowid = newReferenceRowId.toString();
    }
}

function setSuccess(response: ServerResponse): void {
    if (!response.success) {
        console.error("Server error:", response.error);
        return;
    }

    if (!response.html) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(response.html, 'text/html');
    const responseRow = doc.body.firstChild as HTMLElement;

    const formContainer = document.querySelector('.form-container');
    if (formContainer && responseRow) {
        formContainer.before(responseRow);
        responseRow.classList.add('updated-row');

        setTimeout(() => {
            responseRow.classList.remove('updated-row');
        }, 1000);

        responseRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
//#endregion

//#region -- Mention
function initMentions(): void {
    const tribute = new Tribute<Personagem>({
        trigger: '@',
        values: [],
        lookup: 'nome',
        fillAttr: 'nome',
        menuItemTemplate: (item) => item.original.nome,
        selectTemplate: (item) => `@[${item.original.id}|${item.original.nome}]`,
        menuEvents: {
            click: (e, item) => {
                e.preventDefault();
                tribute.selectItemAtIndex(e.currentTarget.getAttribute('data-index'));
            }
        }
    });

    const textoInstrucao = document.getElementById('textoInstrucao');
    if (textoInstrucao) tribute.attach(textoInstrucao);

    fetch(`/Roteiros/GetPersonagensForMentions?cenaId=${currentCenaId}`)
        .then(response => response.json() as Promise<Personagem[]>)
        .then(personagens => tribute.append(0, personagens))
        .catch(error => console.error('Error loading mentions:', error));
}
//#endregion

//#region -- Alerts
function feedbackMessage(status: string, message: string): void {
    let classe: string;
    let texto: string;

    if (status === 'create') {
        classe = 'alert-success';
        texto = `instrução ${message} criada com sucesso`;
    } else if (status === 'above' || status === 'below') {
        classe = 'alert-success';
        texto = `instrução ${message} inserida com sucesso`;
    } else if (status === 'edit') {
        classe = 'alert-success';
        texto = `instrução ${message} atualizada com sucesso`;
    } else {
        classe = 'alert-danger';
        texto = `Erro: ${message}`;
    }

    const formFeedback = document.getElementById('formFeedback');
    if (formFeedback) {
        formFeedback.innerHTML = `<div class="alert ${classe} alert-success">${texto}</div>`;
        formFeedback.style.display = 'none';
        formFeedback.style.display = '';
        setTimeout(() => {
            formFeedback.style.display = 'none';
        }, 2000);
    }
}
//#endregion

//#region -- Personagem Select
function resetToSingleSelect(): void {
    const dynamicContainer = document.getElementById('dynamicPersonagemContainer');
    const selectTemplate = document.getElementById('personagemSelectTemplate');
    const addButton = document.getElementById('addPersonagem');

    if (dynamicContainer && selectTemplate && addButton) {
        dynamicContainer.innerHTML = selectTemplate.innerHTML;
        addButton.style.display = '';
    }
}

function initPersonagemHandlers(): void {
    const addButton = document.getElementById('addPersonagem');
    const dynamicContainer = document.getElementById('dynamicPersonagemContainer');

    if (!addButton || !dynamicContainer) return;

    addButton.addEventListener('click', addPersonagemSelect);

    function addPersonagemSelect(): void {
        if (document.querySelectorAll('[name="personagemIds[]"]').length < 10) {
            const template = document.getElementById('personagemSelectTemplate');
            if (template) {
                dynamicContainer.insertAdjacentHTML('beforeend', template.innerHTML);
            }
        }
    }

    dynamicContainer.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const removeButton = target.closest('.remove-personagem');
        if (removeButton) removePersonagemSelect(removeButton);
    });

    function removePersonagemSelect(button: HTMLElement): void {
        if (document.querySelectorAll('[name="personagemIds[]"]').length > 1) {
            button.closest('.personagem-select-group')?.remove();
        }
    }

    dynamicContainer.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        if (target.classList.contains('personagem-select')) {
            const selectedValue = target.value;
            const addButton = document.getElementById('addPersonagem');

            if (selectedValue === "-1") {
                if (addButton) addButton.style.display = 'none';
                document.querySelectorAll('.personagem-select-group').forEach(group => {
                    if (!group.contains(target)) group.remove();
                });
            } else if (selectedValue === "-2") {
                if (addButton) addButton.style.display = '';
                if (document.querySelectorAll('.personagem-select-group').length === 1) {
                    addPersonagemSelect();
                }
            } else if (addButton) {
                addButton.style.display =
                    document.querySelectorAll('.personagem-select-group').length < 10 ? '' : 'none';
            }
        }
    });
}
//#endregion

//#region -- Create
const showForm = document.getElementById('showForm');
if (showForm) {
    showForm.addEventListener('click', () => {
        setFormState('create', 0);
        const instrucaoForm = document.getElementById('instrucaoForm') as HTMLFormElement;

        const submitHandler = (e: Event) => {
            e.preventDefault();
            const formData = new FormData(instrucaoForm);
            const token = document.querySelector<HTMLInputElement>('input[name="__RequestVerificationToken"]')?.value;

            fetch('/Roteiros/CreateInstrucao', {
                method: 'POST',
                body: new URLSearchParams(formData as any),
                headers: {
                    'RequestVerificationToken': token || ''
                }
            })
                .then(response => response.json() as Promise<ServerResponse>)
                .then(response => {
                    setSuccess(response);
                    instrucaoForm.reset();
                    resetToSingleSelect();
                    const tabela = document.querySelector('.tabela');
                    const formContainer = document.querySelector('.form-container');
                    if (tabela && formContainer) tabela.appendChild(formContainer);
                    feedbackMessage('create', '');
                })
                .catch(error => feedbackMessage('erro', error.message || 'Error'));
        };

        instrucaoForm.onsubmit = submitHandler;
    });
}
//#endregion

//#region -- Edit
document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const editButton = target.closest('.edit-instruction');
    if (!editButton) return;

    const id = editButton.getAttribute('data-id');
    if (!id) return;

    fetch(`/Roteiros/GetInstrucao/${id}`)
        .then(response => response.json() as Promise<InstructionData>)
        .then(dados => {
            setFormState('edit', parseInt(id));

            const form = document.getElementById('instrucaoForm') as HTMLFormElement;
            if (!form) return;

            form.querySelector<HTMLInputElement>('input[name="CenaId"]')!.value = dados.cenaId.toString();
            form.querySelector<HTMLSelectElement>('select[name="TipoDeInstrucao"]')!.value = dados.tipo;
            form.querySelector<HTMLTextAreaElement>('textarea[name="Texto"]')!.value = dados.texto;

            const hiddenId = document.createElement('input');
            hiddenId.type = 'hidden';
            hiddenId.name = 'Id';
            hiddenId.value = dados.id.toString();
            form.appendChild(hiddenId);

            const hiddenOrdem = document.createElement('input');
            hiddenOrdem.type = 'hidden';
            hiddenOrdem.name = 'OrdemCronologica';
            hiddenOrdem.value = dados.ordem.toString();
            form.appendChild(hiddenOrdem);

            form.dataset.editMode = 'true';
            form.dataset.instructionId = id;

            const dynamicContainer = document.getElementById('dynamicPersonagemContainer');
            if (!dynamicContainer) return;

            if (dados.instrucoesPersonagens) {
                dynamicContainer.innerHTML = '';

                if (dados.instrucoesPersonagens.some(ins => ins.showAll)) {
                    const template = document.getElementById('personagemSelectTemplate');
                    if (template) dynamicContainer.innerHTML = template.innerHTML;
                    dynamicContainer.querySelector<HTMLSelectElement>('[name="personagemIds[]"]')!.value = '-1';
                    document.getElementById('addPersonagem')!.style.display = 'none';
                }
                // ... (similar logic for other cases)
            }

            form.onsubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const token = document.querySelector<HTMLInputElement>('input[name="__RequestVerificationToken"]')?.value;

                fetch('/Roteiros/EditInstrucao', {
                    method: 'POST',
                    body: new URLSearchParams(formData as any),
                    headers: {
                        'RequestVerificationToken': token || ''
                    }
                })
                    .then(response => response.json() as Promise<ServerResponse>)
                    .then(response => {
                        document.querySelector(`tr[data-id="${id}"]`)?.remove();
                        setSuccess(response);
                        setFormState('idle', 0);
                        feedbackMessage('edit', dados.ordem.toString());
                    })
                    .catch(error => feedbackMessage('erro', error.message || 'Error'));
            };
        });
});
//#endregion


//#region -- Insert
document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const insertButton = target.closest('.insert-above, .insert-below');
    if (!insertButton) return;

    const referenceId = insertButton.getAttribute('data-id');
    if (!referenceId) return;

    const position = insertButton.classList.contains('insert-above') ? 'above' : 'below';
    const referenceRow = document.querySelector(`tr[data-id="${referenceId}"]`) as HTMLElement;
    const referenceOrder = parseInt(referenceRow.querySelector('.js-ordem')?.textContent || '0');

    const getOrdem = () => position === 'above' ? referenceOrder : referenceOrder + 1;
    setFormState(position, parseInt(referenceId));

    const form = document.getElementById('instrucaoForm');
    if (!form) return;

    const hiddenFields = `
        <input type="hidden" name="referenceId" value="${referenceId}">
        <input type="hidden" name="insertPosition" value="${position}">
        <input type="hidden" name="OrdemCronologica" value="${getOrdem()}">
    `;
    form.insertAdjacentHTML('beforeend', hiddenFields);

    form.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const token = document.querySelector<HTMLInputElement>('input[name="__RequestVerificationToken"]')?.value;

        fetch('/Roteiros/InsertInstrucao', {
            method: 'POST',
            body: new URLSearchParams(formData as any),
            headers: {
                'RequestVerificationToken': token || ''
            }
        })
            .then(response => response.json() as Promise<ServerResponse>)
            .then(response => {
                setSuccess(response);
                setFormState('idle', 0);
                updateOrderNumbers();
                feedbackMessage(position, getOrdem().toString());
            })
            .catch(error => feedbackMessage('erro', error.message || 'Error'));
    };
});

function updateOrderNumbers(): void {
    let currentOrder = 1;
    document.querySelectorAll('tbody tr[data-id]').forEach(row => {
        if (row.classList.contains('form-container')) return;

        const orderElement = row.querySelector('.js-ordem');
        if (orderElement) {
            orderElement.textContent = currentOrder.toString();
            row.setAttribute('data-ordem', currentOrder.toString());
            currentOrder++;
        }
    });
}
//#endregion

//#region -- Delete
document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const deleteButton = target.closest('.delete-instruction');
    if (!deleteButton) return;

    if (!confirm('Tem certeza que deseja excluir esta instrução?')) return;

    const row = deleteButton.closest('tr');
    if (!row) return;

    const deletedOrder = parseInt(row.querySelector('.js-ordem')?.textContent || '0');
    const instructionId = deleteButton.getAttribute('data-id');
    const token = document.querySelector<HTMLMetaElement>('meta[name="__RequestVerificationToken"]')?.content;

    if (!instructionId || !token) return;

    fetch('/Roteiros/DeletaInstrucao', {
        method: 'POST',
        body: JSON.stringify({ id: instructionId }),
        headers: {
            'Content-Type': 'application/json',
            'RequestVerificationToken': token
        }
    })
        .then(response => response.json() as Promise<ServerResponse>)
        .then(response => {
            if (response.success) {
                row.style.opacity = '0';
                setTimeout(() => {
                    row.remove();

                    // Update order numbers for remaining instructions
                    document.querySelectorAll('.lista-instrucoes tr').forEach(tr => {
                        const orderElement = tr.querySelector('.js-ordem');
                        if (!orderElement) return;

                        const currentOrder = parseInt(orderElement.textContent || '0');
                        if (currentOrder > deletedOrder) {
                            orderElement.textContent = (currentOrder - 1).toString();
                        }
                    });
                }, 300);
            } else {
                alert('Erro ao excluir: ' + response.message);
            }
        })
        .catch(error => alert('Erro: ' + error));
});
//#endregion

//#region -- Move
document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const moveButton = target.closest('.move-up, .move-down');
    if (!moveButton) return;

    const instructionId = moveButton.getAttribute('data-id');
    if (!instructionId) return;

    const direction = moveButton.classList.contains('move-up') ? 'up' : 'down';
    moveInstruction(parseInt(instructionId), direction);
});

function moveInstruction(instructionId: number, direction: 'up' | 'down'): void {
    const token = document.querySelector<HTMLMetaElement>('meta[name="__RequestVerificationToken"]')?.content;
    if (!token) return;

    const row = document.querySelector(`tr[data-id="${instructionId}"]`) as HTMLElement;
    if (!row) return;

    const currentOrder = parseInt(row.querySelector('.js-ordem')?.textContent || '0');
    const totalRows = document.querySelectorAll('.lista-instrucoes tr').length;

    // Prevent moving beyond limits
    if ((direction === 'up' && currentOrder <= 1) ||
        (direction === 'down' && currentOrder >= totalRows)) {
        return;
    }

    fetch(`/Roteiros/MoveInstruction${direction === 'up' ? 'Up' : 'Down'}`, {
        method: 'POST',
        body: JSON.stringify({ id: instructionId }),
        headers: {
            'Content-Type': 'application/json',
            'RequestVerificationToken': token
        }
    })
        .then(response => response.json() as Promise<ServerResponse>)
        .then(response => {
            if (response.success && response.swappedId && response.newOrder && response.swappedOrder) {
                const targetRow = document.querySelector(`tr[data-id="${response.swappedId}"]`) as HTMLElement;
                if (!targetRow) return;

                // Update order numbers
                const rowOrderElement = row.querySelector('.js-ordem');
                const targetOrderElement = targetRow.querySelector('.js-ordem');

                if (rowOrderElement) rowOrderElement.textContent = response.newOrder.toString();
                if (targetOrderElement) targetOrderElement.textContent = response.swappedOrder.toString();

                // Reorder DOM elements
                if (direction === 'up') {
                    row.parentNode?.insertBefore(row, targetRow);
                } else {
                    row.parentNode?.insertBefore(targetRow, row);
                }

                // Highlight updated rows
                [row, targetRow].forEach(r => {
                    r.classList.add('updated-row');
                    setTimeout(() => r.classList.remove('updated-row'), 1000);
                });
            } else {
                alert('Erro ao mover: ' + response.message);
            }
        })
        .catch(error => alert('Erro: ' + error));
}
//#endregion