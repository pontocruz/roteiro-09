// FILE: EditaRoteiro.js

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


//#region -- ALERTS
function feedbackMessage(status, message) {
    const messages = {
        create: m => `Instrução ${m} criada com sucesso`,
        edit: m => `Instrução ${m} atualizada com sucesso`,
        above: m => `Instrução ${m} inserida acima com sucesso`,
        below: m => `Instrução ${m} inserida abaixo com sucesso`,
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
/* Adds a temporary class to an element that auto-removes after delay
 * @param {HTMLElement} element - DOM element to animate
 * @param {string} className - Class to add/remove
 * @param {number} duration - Duration in ms before removal
 */
function tempClass(element, className, duration = 1000) {
    element.classList.add(className);
    setTimeout(() => {
        element.classList.remove(className);
    }, duration);
}

//#endregion -- ALERTS 

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


//#region -- PERSONAGEM SELECT 
function initPersonagemHandlers(isEditMode) {
    const container = document.getElementById('dynamicPersonagemContainer');
    const template = document.getElementById('personagemSelectTemplate');
    const addButton = document.getElementById('addPersonagem');

    // Initialize container content
    container.innerHTML = isEditMode ? template.innerHTML : '';

    // Add button handler
    addButton.onclick = function() {
        const selects = document.querySelectorAll('[name="personagemIds[]"]');
        if (selects.length < 10) {
            container.insertAdjacentHTML('beforeend', template.innerHTML);
        }
    };

    // Remove button handler
    container.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-personagem')) {
            const selects = document.querySelectorAll('[name="personagemIds[]"]');
            if (selects.length > 1) {
                e.target.closest('.personagem-select-group').remove();
            }
        }
    });

    // Select change handler
    container.addEventListener('change', function(e) {
        if (e.target.classList.contains('personagem-select')) {
            const selects = document.querySelectorAll('[name="personagemIds[]"]');
            let showAddButton = true;

            for (let i = 0; i < selects.length; i++) {
                if (selects[i].value === "-1" || selects.length >= 10) {
                    showAddButton = false;
                    break;
                }
            }

            addButton.style.display = showAddButton ? '' : 'none';
        }
    });
}
function resetToSingleSelect() {
    var container = document.getElementById('dynamicPersonagemContainer');
    var template = document.getElementById('personagemSelectTemplate');

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

    document.getElementById('dynamicPersonagemContainer').addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-personagem')) {
            removePersonagemSelect(e.target);
        }
    });

    function removePersonagemSelect(button) {
        if (document.querySelectorAll('[name="personagemIds[]"]').length > 1) {
            button.closest('.personagem-select-group').remove();
        }
    }

    document.getElementById('dynamicPersonagemContainer').addEventListener('change', function(e) {
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


//#region -- CREATE 

document.getElementById('showForm').addEventListener('click', function () {
    setFormState('create', 0);
    $('#instrucaoForm').off('submit');
    $('#instrucaoForm').on('submit', function (e) {
        e.preventDefault();
        const formData = $(this).serializeArray();
        $.ajax({
            url: '/Roteiros/CreateInstrucao',
            type: 'POST',
            data: $.param(formData),
            headers: {'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()},
            success: function (response) {
                setSuccess(response);
                $('#instrucaoForm')[0].reset();
                resetToSingleSelect();
                $('.tabela tbody').append($('.form-container'));
                feedbackMessage('create', '');
            },
            error: function (xhr) {
                feedbackMessage(`erro`, `${xhr.responseJSON?.title || xhr.statusText}`);
            }
        });
    });
});

//#endregion -- CREATE


//#region -- EDIT

$(document).on('click', '.edit-instruction', function () {
    const id = $(this).data('id');
    $.get(`/Roteiros/GetInstrucao/${id}`, function (dados) {
        setFormState('edit', id);
        $('#instrucaoForm input[name="CenaId"]').val(dados.cenaId);
        $('#instrucaoForm select[name="TipoDeInstrucao"]').val(dados.tipo);
        $('#instrucaoForm textarea[name="Texto"]').val(dados.texto);
        $('#instrucaoForm').append(`<input type="hidden" name="Id" value="${dados.id}">`);
        $('#instrucaoForm').append(`<input type="hidden" name="OrdemCronologica" value="${dados.ordem}">`);
        $('#instrucaoForm').attr('data-edit-mode', 'true').attr('data-instruction-id', id); //REVER
        if (dados.instrucoesPersonagens) {
            $('#dynamicPersonagemContainer').empty();
            if (dados.instrucoesPersonagens.some(ins => ins.showAll)) {
                $('#dynamicPersonagemContainer').append($('#personagemSelectTemplate').html());
                $('[name="personagemIds[]"]').first().val('-1');
                $('#addPersonagem').hide();
            } else if (dados.instrucoesPersonagens.some(ins => ins.showAllExcept)) {
                $('#dynamicPersonagemContainer').append($('#personagemSelectTemplate').html());
                $('[name="personagemIds[]"]').first().val('-2');
                const exceptions = dados.instrucoesPersonagens.filter(ins => ins.showAllExcept && ins.personagemId).map(ins => ins.personagemId);
                exceptions.forEach((personagemId, index) => {
                    if (index < 9) {
                        $('#dynamicPersonagemContainer').append($('#personagemSelectTemplate').html());
                        $(`[name="personagemIds[]"]`).eq(index + 1).val(personagemId);
                    }
                });
                $('#addPersonagem').toggle(exceptions.length < 9);
            } else if (dados.personagemIds && dados.personagemIds.length > 0) {
                dados.personagemIds.forEach((personagemId, index) => {
                    if (index < 10) {
                        $('#dynamicPersonagemContainer').append($('#personagemSelectTemplate').html());
                        $(`[name="personagemIds[]"]`).eq(index).val(personagemId);
                    }
                });
                $('#addPersonagem').toggle(dados.personagemIds.filter(id => id > 0).length < 10);
            }
        }
        $('#instrucaoForm').off('submit').on('submit', function (e) {
            e.preventDefault();
            const formData = $(this).serializeArray();
            $.ajax({
                url: '/Roteiros/EditInstrucao',
                type: 'POST',
                data: $.param(formData),
                headers: {'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()},
                success: function (response) {
                    $(`tr[data-id="${id}"]`).remove();
                    setSuccess(response);
                    setFormState('idle', 0);
                    feedbackMessage('edit', `${dados.ordem}`);
                },
                error: function (xhr) {
                    feedbackMessage(`erro`, `${xhr.responseJSON?.title || xhr.statusText}`);
                }
            });
        });
    });
});

//#endregion -- EDIT


//#region -- INSERT

$(document).on('click', '.insert-above, .insert-below', function () {
    const referenceId = $(this).data('id');
    const position = $(this).hasClass('insert-above') ? 'above' : 'below';
    const referenceRow = $(`tr[data-id="${referenceId}"]`);
    const referenceOrder = parseInt(referenceRow.find('.js-ordem').text());
    const dados = {ordem: getOrdem()};

    function getOrdem() {
        if (position === 'above') {
            return referenceOrder
        } else {
            return referenceOrder + 1
        }
    }

    setFormState(position, referenceId);
    const hiddenFields = `<input type="hidden" name="referenceId" value="${referenceId}"><input type="hidden" name="insertPosition" value="${position}"><input type="hidden" name="OrdemCronologica" value="${position === 'above' ? referenceOrder : referenceOrder + 1}">`;//REVER
    const clonedForm = $('#instrucaoForm');
    clonedForm.append(hiddenFields);
    $(clonedForm).off('submit').on('submit', function (e) {
        e.preventDefault();
        const formData = $(this).serializeArray();
        $.ajax({
            url: '/Roteiros/InsertInstrucao',
            type: 'POST',
            data: $.param(formData),
            headers: {'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()},
            success: function (response) {
                setSuccess(response);
                setFormState('idle', 0);
                updateOrderNumbers();
                feedbackMessage(position, `${dados.ordem}`);
            },
            error: function (xhr) {
                feedbackMessage(`erro`, `${xhr.responseJSON?.title || xhr.statusText}`);
            }
        });
    });
});

function updateOrderNumbers() {
    let currentOrder = 1;
    $('tbody tr[data-id]').each(function () {
        const $row = $(this);
        if ($row.hasClass('form-container')) return;
        $row.find('.js-ordem').text(currentOrder);
        $row.attr('data-ordem', currentOrder);
        currentOrder++;
    });
}

//#endregion -- INSERT


//#region -- DELETE


$(document).on('click', '.delete-instruction', function () {
    if (!confirm('Tem certeza que deseja excluir esta instrução?')) return;

    const $row = $(this).closest('tr');
    const deletedOrder = parseInt($row.find('.js-ordem').text()); // Get the numeric order value
    const instructionId = $(this).data('id');
    const token = $('meta[name="__RequestVerificationToken"]').attr('content');

    $.ajax({
        url: '/Roteiros/DeletaInstrucao',
        type: 'POST',
        data: JSON.stringify({id: instructionId}),
        contentType: 'application/json',
        headers: {'RequestVerificationToken': token},
        success: function (response) {
            if (response.success) {
                $row.fadeOut(300, function () {
                    $(this).remove();

                    // EXACTLY mirror server behavior:
                    // 1. Find all instructions with higher order numbers
                    $('.lista-instrucoes tr').each(function () {
                        const $ordem = $(this).find('.js-ordem');
                        const currentOrder = parseInt($ordem.text());

                        // 2. Only decrement those with order > deletedOrder
                        if (currentOrder > deletedOrder) {
                            $ordem.text(currentOrder - 1);
                        }
                    });
                });
            } else {
                alert('Erro ao excluir: ' + response.message);
            }
        },
        error: function (xhr) {
            alert('Erro: ' + xhr.responseText);
        }
    });
});

//#endregion -- DELETE


//#region -- MOVE

// Move Up handler
$(document).on('click', '.move-up', function () {
    const instructionId = $(this).data('id');
    moveInstruction(instructionId, 'up');
});

// Move Down handler
$(document).on('click', '.move-down', function () {
    const instructionId = $(this).data('id');
    moveInstruction(instructionId, 'down');
});

function moveInstruction(instructionId, direction) {
    const token = $('meta[name="__RequestVerificationToken"]').attr('content');
    const $row = $(`tr[data-id="${instructionId}"]`);
    const currentOrder = parseInt($row.find('.js-ordem').text());

    // Prevent moving beyond limits
    if ((direction === 'up' && currentOrder <= 1) ||
        (direction === 'down' && currentOrder >= $('.lista-instrucoes tr').length)) {
        return;
    }

    $.ajax({
        url: `/Roteiros/MoveInstruction${direction === 'up' ? 'Up' : 'Down'}`,
        type: 'POST',
        data: JSON.stringify({id: instructionId}),
        contentType: 'application/json',
        headers: {'RequestVerificationToken': token},
        success: function (response) {
            if (response.success) {
                // Update client-side display
                const $targetRow = $(`tr[data-id="${response.swappedId}"]`);

                // Swap the order numbers
                $row.find('.js-ordem').text(response.newOrder);
                $targetRow.find('.js-ordem').text(response.swappedOrder);

                // Reorder DOM elements if needed
                if (direction === 'up') {
                    $row.insertBefore($targetRow);
                } else {
                    $row.insertAfter($targetRow);
                }
                $row.add($targetRow).addClass('updated-row').delay(1000).queue(function () {
                    $(this).removeClass('updated-row').dequeue();
                });

            } else {
                alert('Erro ao mover: ' + response.message);
            }
        },
        error: function (xhr) {
            alert('Erro: ' + xhr.responseText);
        }
    });
}

//#endregion -- MOVE
