// FILE: EditaRoteiro.js

//#region -- CONSTANTS

const MAX_PERSONAGEM_SELECTS = 10;
const URLS = {
    GET: '/Roteiros/GetInstrucao',
    CREATE: '/Roteiros/CreateInstrucao',
    EDIT: '/Roteiros/EditInstrucao',
    INSERT: '/Roteiros/InsertInstrucao',
    DELETE: '/Roteiros/DeletaInstrucao',
    MOVE_UP: '/Roteiros/MoveInstructionUp',
    MOVE_DOWN: '/Roteiros/MoveInstructionDown',
    MENTIONS: '/Roteiros/GetPersonagensForMentions'
};

//#endregion -- CONSTANTS

//#region -- UTILITY

function updateOrderNumbers() {
    let currentOrder = 1;
    const rows = document.querySelectorAll('tbody tr[data-id]');

    rows.forEach(row => {
        if (row.classList.contains('form-container')) return;

        const orderElement = row.querySelector('.js-ordem');
        if (orderElement) {
            orderElement.textContent = currentOrder;
        }
        row.dataset.ordem = currentOrder;
        currentOrder++;
    });
}

function addHiddenInput(form, name, value) {

    const hiddenId = document.createElement('input');
    hiddenId.type = 'hidden';
    hiddenId.name = name;
    hiddenId.value = value;
    form.appendChild(hiddenId);
}

function serializeForm(form) {
    var formData = [];
    var elements = form.elements;

    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];

        // Skip unnamed, disabled, or file inputs
        if (!element.name || element.disabled || element.type === 'file') continue;

        // Handle checkboxes/radios (only if checked)
        if ((element.type === 'checkbox' || element.type === 'radio') && !element.checked) continue;

        // Handle multi-select
        if (element.multiple) {
            for (var j = 0; j < element.options.length; j++) {
                if (element.options[j].selected) {
                    formData.push({name: element.name, value: element.options[j].value});
                }
            }
        }
        // Normal input/select/textarea
        else {
            formData.push({name: element.name, value: element.value});
        }
    }

    return formData;
}

function ajaxPost(url, data, options) {
    const {headers = {}, success, error} = options;
    const params = new URLSearchParams();

    // Convert { name: "field", value: "val" } to URL-encoded string
    if (Array.isArray(data)) {
        data.forEach(item => params.append(item.name, item.value));
    } else {
        for (const key in data) {
            params.append(key, data[key]);
        }
    }

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            ...headers
        },
        body: params.toString()
    })
        .then(response => {
            if (!response.ok) throw response;
            return response.json();
        })
        .then(success)
        .catch(error);
}

function ajaxJsonPost(url, data, options) {
    const {headers = {}, success, error} = options;

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body: JSON.stringify(data)
    })
        .then(async response => {
            if (!response.ok) {
                const err = await response.json().catch(() => null);
                throw {response, err};
            }
            return response.json();
        })
        .then(success)
        .catch(error);
}

function feedbackMessage(status, message) {
    const messages = {
        create: m => `Instrução ${m} criada com sucesso`,
        edit: m => `Instrução ${m} atualizada com sucesso`,
        above: m => `Instrução ${m} inserida acima com sucesso`,
        below: m => `Instrução ${m} inserida abaixo com sucesso`,
        insert: m => `Instrução ${m} inserida com sucesso`,
        erro: m => `Erro: ${m}`
    };

    const alert = document.createElement('div');
    alert.className = `alert ${status === 'erro' ? 'alert-danger' : 'alert-success'}`;
    alert.textContent = messages[status]?.(message) || messages.erro(message);

    const container = document.getElementById('formFeedback');
    container.innerHTML = '';
    container.appendChild(alert);
    container.style.display = 'none';
    setTimeout(() => {
        container.style.display = '';
        setTimeout(() => container.style.display = 'none', 2000);
    }, 10);
}

function tempClass(element, className, duration = 1000) {
    element.classList.add(className);
    setTimeout(() => {
        element.classList.remove(className);
    }, duration);
}

//#endregion -- UTILITY

//#region -- MENTION

function initMentions() {
    const tribute = new Tribute({
        trigger: '@',
        values: [], // Initially empty
        lookup: 'nome', // Property to display
        fillAttr: 'nome', // Property to  insert
        menuItemTemplate: (item) => item.original.nome,
        selectTemplate: (item) => `@[${item.original.id}|${item.original.nome}]`,
        menuEvents: {
            click: (e, item) => {
                e.preventDefault();
                tribute.selectItemAtIndex(e.currentTarget.getAttribute('data-index'));
            }
        }
    });

    tribute.attach(document.getElementById('textoInstrucao'));

    fetch(`${URLS.MENTIONS}?cenaId=${currentCenaId}`)
        .then(response => response.json())
        .then(personagens => {
            tribute.append(0, personagens); // Load data into Tribute
        });
}

//#endregion -- MENTION

//#region -- PERSONAGEM SELECT 

function resetToSingleSelect() {
    const container = document.getElementById('dynamicPersonagemContainer');
    const template = document.getElementById('personagemSelectTemplate');
    container.innerHTML = '';
    container.insertAdjacentHTML('beforeend', template.innerHTML);

    document.getElementById('addPersonagem').style.display = '';
}

function initPersonagemHandlers() {
    document.getElementById('addPersonagem').addEventListener('click', addPersonagemSelect);

    function addPersonagemSelect() {
        if (document.querySelectorAll('[name="personagemIds[]"]').length < 10) {
            document.getElementById('dynamicPersonagemContainer').insertAdjacentHTML('beforeend', document.getElementById('personagemSelectTemplate').innerHTML);
        }
    }

    document.getElementById('dynamicPersonagemContainer').addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-personagem')) {
            removePersonagemSelect(e.target);
        }
    });

    function removePersonagemSelect(button) {
        if (document.querySelectorAll('[name="personagemIds[]"]').length > 1) {
            button.closest('.personagem-select-group').remove();
        }
    }

    document.getElementById('dynamicPersonagemContainer').addEventListener('change', function (e) {
        if (e.target.classList.contains('personagem-select')) {
            const selectedValue = e.target.value;
            const addPersonagemBtn = document.getElementById('addPersonagem');

            if (selectedValue === "-1") {
                addPersonagemBtn.style.display = 'none';
                const groups = document.querySelectorAll('.personagem-select-group');
                const currentGroup = e.target.closest('.personagem-select-group');

                for (let i = 0; i < groups.length; i++) {
                    if (groups[i] !== currentGroup) {
                        groups[i].remove();
                    }
                }
            } else if (selectedValue === "-2") {
                addPersonagemBtn.style.display = '';
                if (document.querySelectorAll('.personagem-select-group').length === 1) {
                    addPersonagemSelect();
                }
            } else {
                addPersonagemBtn.style.display = document.querySelectorAll('.personagem-select-group').length < 10 ? '' : 'none';
            }
        }
    });
}

//#endregion -- PERSONAGEM SELECT 

//#region -- STATE

const state = {
    modo: 'idle',
    referenceRowId: 0,
    update(newModo, newReferenceRowId) {
        this.modo = newModo;
        this.referenceRowId = newReferenceRowId;
    }
};

function setFormState(modo, referenceRowId) {
    const referenceRow = document.getElementById(`row-${referenceRowId}`);
    if (state.modo === 'edit' && state.referenceRowId !== referenceRowId) {
        const previousRow = document.getElementById(`row-${state.referenceRowId}`);
        previousRow.style.display = '';
    }
    document.querySelectorAll('.form-container').forEach(el => el.remove());
    if (modo !== 'idle') {
        const originalTemplate = document.getElementById('formTemplate');
        const clonedTemplate = originalTemplate.content.cloneNode(true);
        const showFormButton = document.getElementById('showForm');
        const table = document.querySelector('.tabela tbody');
        if (modo === 'create') {
            showFormButton.style.display = 'none';
            table.appendChild(clonedTemplate);
        } else {
            showFormButton.style.display = '';
            referenceRow[modo === 'above' ? 'before' : 'after'](clonedTemplate);
        }
        if (modo === 'edit') {
            referenceRow.style.display = 'none';
            const personagemContainer = document.getElementById('dynamicPersonagemContainer');
            const personagemTemplate = document.getElementById('personagemSelectTemplate');
            personagemContainer.innerHTML = personagemTemplate.innerHTML;
        } else {
            resetToSingleSelect();
        }
        initPersonagemHandlers();
        initMentions();
        const formContainer = document.querySelector('.form-container');

        formContainer.scrollIntoView({
            behavior: 'smooth',
            block: 'end'
        });

        const cancelButton = document.getElementById('cancelaForm');
        cancelButton.addEventListener('click', () => setFormState('idle', 0));

    } else {
        const showFormButton = document.getElementById('showForm');
        showFormButton.style.display = '';
    }
    state.update(modo, referenceRowId);
}

function setSuccess(response) {
    const formContainer = document.querySelector('.form-container');
    formContainer.insertAdjacentHTML('beforebegin', response.html);
    const responseRow = formContainer.previousElementSibling;
    tempClass(responseRow, 'updated-row');
    responseRow.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

//#endregion -- STATE

//#region -- CREATE 

document.getElementById('showForm').addEventListener('click', function () {
    setFormState('create', 0);
    handleFormCreate();
});

function handleFormCreate() {
    const form = document.getElementById('instrucaoForm');
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = serializeForm(form);
        const token = document.querySelector('input[name="__RequestVerificationToken"]').value;

        ajaxPost(URLS.CREATE, formData, {
                headers: {'RequestVerificationToken': token},
                success: function (response) {
                    setSuccess(response);
                    form.reset();
                    resetToSingleSelect();
                    document.querySelector('.tabela tbody')
                        .appendChild(document.querySelector('.form-container'));
                    feedbackMessage('create', '');
                },
                error: function (xhr) {
                    if (typeof xhr.json === 'function') {
                        xhr.json().then(err => {
                            feedbackMessage('erro', err.title || xhr.statusText);
                        }).catch(() => {
                            feedbackMessage('erro', xhr.statusText);
                        });
                    } else {
                        // Fallback for network errors
                        feedbackMessage('erro', xhr.message || "Unknown error");
                    }
                }
            }
        );
    });
}

//#endregion -- CREATE

//#region -- EDIT

document.addEventListener('click', e => {
    if (e.target.classList.contains('edit-instruction')) {
        const rowId = e.target.dataset.id;
        setFormState('edit', rowId);
        getEditData(rowId);
        handleFormEdit(rowId);
    }
});

function getEditData(rowId) {
    fetch(`${URLS.GET}/${rowId}`)
        .then(response => response.json())
        .then(dados => {
            document.querySelector('#instrucaoForm input[name="CenaId"]').value = dados.cenaId;
            document.querySelector('#instrucaoForm select[name="TipoDeInstrucao"]').value = dados.tipo;
            document.querySelector('#instrucaoForm textarea[name="Texto"]').value = dados.texto;
            const form = document.getElementById('instrucaoForm');
            addHiddenInput(form, 'Id', dados.id);
            addHiddenInput(form, 'OrdemCronologica', dados.ordem);

            if (dados.instrucoesPersonagens) {
                const container = document.getElementById('dynamicPersonagemContainer');
                const template = document.getElementById('personagemSelectTemplate').innerHTML;
                const addButton = document.getElementById('addPersonagem');

                // Clear existing content
                container.innerHTML = '';

                // Helper to add select element
                const addSelect = () => container.insertAdjacentHTML('beforeend', template);
                const getSelects = () => container.querySelectorAll('[name="personagemIds[]"]');

                if (dados.instrucoesPersonagens.some(ins => ins.showAll)) {
                    // Case 1: Show All
                    addSelect();
                    getSelects()[0].value = '-1';
                    addButton.style.display = 'none';
                } else if (dados.instrucoesPersonagens.some(ins => ins.showAllExcept)) {
                    // Case 2: Show All Except
                    addSelect();
                    getSelects()[0].value = '-2';

                    const exceptions = dados.instrucoesPersonagens
                        .filter(ins => ins.showAllExcept && ins.personagemId)
                        .map(ins => ins.personagemId);

                    exceptions.forEach((personagemId, index) => {
                        if (index < 9) {
                            addSelect();
                            getSelects()[index + 1].value = personagemId;
                        }
                    });

                    addButton.style.display = exceptions.length < 9 ? '' : 'none';
                } else if (dados.personagemIds?.length > 0) {
                    // Case 3: Specific Personagens
                    dados.personagemIds.forEach((personagemId, index) => {
                        if (index < 10) {
                            addSelect();
                            getSelects()[index].value = personagemId;
                        }
                    });

                    const validIds = dados.personagemIds.filter(id => id > 0);
                    addButton.style.display = validIds.length < 10 ? '' : 'none';
                }
            }
        })
        .catch(error => {
            console.error('Request failed:', error);
        });
}

function handleFormEdit(rowId) {
    const form = document.getElementById('instrucaoForm');
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = serializeForm(form);
        const token = document.querySelector('input[name="__RequestVerificationToken"]').value;

        ajaxPost(URLS.EDIT, formData, {
                headers: {'RequestVerificationToken': token},
                success: function (response) {
                    document.querySelector(`tr[data-id="${rowId}"]`)?.remove();
                    setSuccess(response);
                    setFormState('idle', 0);
                    feedbackMessage('edit', '');
                },
                error: function (xhr) {
                    if (typeof xhr.json === 'function') {
                        xhr.json().then(err => {
                            feedbackMessage('erro', err.title || xhr.statusText);
                        }).catch(() => {
                            feedbackMessage('erro', xhr.statusText);
                        });
                    } else {
                        // Fallback for network errors
                        feedbackMessage('erro', xhr.message || "Unknown error");
                    }
                }
            }
        );
    });
}

//#endregion -- EDIT

//#region -- INSERT

document.addEventListener('click', function (e) {
    if (e.target.classList.contains('insert-above') ||
        e.target.classList.contains('insert-below')) {
        const referenceId = e.target.dataset.id;
        const position = e.target.classList.contains('insert-above') ? 'above' : 'below';
        setFormState(position, referenceId);
        setInsertData(referenceId, position);
        handleFormInsert();
    }
});

function setInsertData(referenceId, position) {
    const form = document.getElementById('instrucaoForm');
    const referenceRow = document.querySelector(`tr[data-id="${referenceId}"]`);
    const referenceOrder = parseInt(referenceRow.querySelector('.js-ordem').textContent);
    addHiddenInput(form, 'referenceId', referenceId);
    addHiddenInput(form, 'insertPosition', position);
    addHiddenInput(form, 'OrdemCronologica', position === 'above' ? referenceOrder : referenceOrder + 1);
}

function handleFormInsert() {
    const form = document.getElementById('instrucaoForm');
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = serializeForm(form);
        const token = document.querySelector('input[name="__RequestVerificationToken"]').value;
        ajaxPost(URLS.INSERT, formData, {
                headers: {'RequestVerificationToken': token},
                success: function (response) {
                    setSuccess(response);
                    setFormState('idle', 0);
                    updateOrderNumbers();
                    feedbackMessage('insert', '');
                },
                error: function (xhr) {
                    if (typeof xhr.json === 'function') {
                        xhr.json().then(err => {
                            feedbackMessage('erro', err.title || xhr.statusText);
                        }).catch(() => {
                            feedbackMessage('erro', xhr.statusText);
                        });
                    } else {
                        // Fallback for network errors
                        feedbackMessage('erro', xhr.message || "Unknown error");
                    }
                }
            }
        );
    });
}

//#endregion -- INSERT

//#region -- DELETE
// TRATAR: 
// quando clicar em delete e move, apagar form
// OU
// não deixar clicar em delete e move com form aberto


document.addEventListener('click', e => {
    if (e.target.classList.contains('delete-instruction')) {
        if (!confirm('Tem certeza que deseja excluir esta instrução?')) return;
        deleteSingleInstruction(e.target);
    }
});

function deleteSingleInstruction(button) {
    const row = button.closest('tr');
    const orderElement = row.querySelector('.js-ordem');
    const deletedOrder = parseInt(orderElement.textContent);
    const instructionId = button.dataset.id;
    const token = document.querySelector('meta[name="__RequestVerificationToken"]').content;
    ajaxJsonPost(
        URLS.DELETE, {id: instructionId}, {
            headers: {'RequestVerificationToken': token},
            success: function (response) {
                if (response.success) {
                    row.animate([{opacity: 1}, {opacity: 0}], {duration: 300})
                        .finished.then(() => {
                        row.remove();
                        document.querySelectorAll('.lista-instrucoes tr').forEach(tr => {
                            const ordemElement = tr.querySelector('.js-ordem');
                            if (!ordemElement) return;
                            const currentOrder = parseInt(ordemElement.textContent);
                            if (currentOrder > deletedOrder) {
                                ordemElement.textContent = currentOrder - 1;
                            }
                        });
                    }, 300);
                } else {
                    alert('Erro ao excluir: ' + response.message);
                }
            },
            error: function (xhr) {
                const errorMsg = xhr.err?.message || xhr.response?.statusText || xhr.message || "Erro desconhecido";
                alert('Erro: ' + errorMsg);
            }
        }
    );
}

//#endregion -- DELETE

//#region -- MOVE
// TRATAR: 
// quando clicar em delete e move, apagar form
// OU
// não deixar clicar em delete e move com form aberto
// Move Up handler
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('move-up')) {
        const instructionId = event.target.dataset.id;
        moveInstruction(instructionId, 'up');
    }
});

// Move Down handler
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('move-down')) {
        const instructionId = event.target.dataset.id;
        moveInstruction(instructionId, 'down');
    }
});

function moveInstruction(instructionId, direction) {
    const token = document.querySelector('meta[name="__RequestVerificationToken"]').content;
    const row = document.querySelector(`tr[data-id="${instructionId}"]`);
    const currentOrder = parseInt(row.querySelector('.js-ordem').textContent);
    const totalRows = document.querySelectorAll('.lista-instrucoes tr').length;

    // Prevent moving beyond limits
    if ((direction === 'up' && currentOrder <= 1) ||
        (direction === 'down' && currentOrder >= totalRows)) {
        return;
    }

    ajaxJsonPost(
        `/Roteiros/MoveInstruction${direction === 'up' ? 'Up' : 'Down'}`,
        { id: instructionId },
        {
            headers: { 'RequestVerificationToken': token },
            success: function(response) {
                if (response.success) {
                    // Update client-side display
                    const targetRow = document.querySelector(`tr[data-id="${response.swappedId}"]`);

                    // Swap the order numbers
                    row.querySelector('.js-ordem').textContent = response.newOrder;
                    targetRow.querySelector('.js-ordem').textContent = response.swappedOrder;

                    // Reorder DOM elements
                    if (direction === 'up') {
                        row.parentNode.insertBefore(row, targetRow);
                    } else {
                        row.parentNode.insertBefore(row, targetRow.nextSibling);
                    }

                    // Highlight animation
                    [row, targetRow].forEach(el => {
                        el.classList.add('updated-row');
                        setTimeout(() => {
                            el.classList.remove('updated-row');
                        }, 1000);
                    });

                } else {
                    alert('Erro ao mover: ' + response.message);
                }
            },
            error: function(xhr) {
                const errorMsg = xhr.err?.message || xhr.response?.statusText || xhr.message || "Erro desconhecido";
                alert('Erro: ' + errorMsg);
            }
        }
    );
}

//#endregion -- MOVE
