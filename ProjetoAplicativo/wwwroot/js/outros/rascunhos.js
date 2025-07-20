
function setFormState(modo, referenceRowId) {
    const {modo: currentModo, referenceRowId: currentRowId} = state;
    const referenceRow = document.querySelector(`tr[data-id="${referenceRowId}"]`);

    // Clean up previous state
    if (currentModo === 'edit' && currentRowId !== referenceRowId) {
        const previousRow = document.querySelector(`tr[data-id="${currentRowId}"]`);
        if (previousRow) previousRow.style.display = '';
    }

    // Remove existing form containers
    document.querySelectorAll('.form-container').forEach(el => el.remove());


    if (modo !== 'idle') {
        // Create new form container
        const formContainer = document.createElement('tr');
        formContainer.className = 'form-container';
        formContainer.innerHTML = '<td colspan="3"></td>';

// Clone template content
        const clonedTemplate = document.getElementById('formTemplate');
        if (clonedTemplate) {
            formContainer.querySelector('td').appendChild(clonedTemplate.content.cloneNode(true));
        }

        const showFormButton = document.getElementById('showForm');
        const table = document.querySelector('.tabela');

        if (modo === 'create') {
            if (showFormButton) showFormButton.style.display = 'none';
            if (table) table.appendChild(formContainer);
        } else {
            if (showFormButton) showFormButton.style.display = '';
            if (referenceRow) {
                if (modo === 'above') {
                    referenceRow.before(formContainer);
                } else {
                    referenceRow.after(formContainer);
                }
            }
        }

        // Edit mode specific logic
        if (modo === 'edit') {
            if (referenceRow) referenceRow.style.display = 'none';

            const personagemContainer = document.getElementById('dynamicPersonagemContainer');
            const personagemTemplate = document.getElementById('personagemSelectTemplate');
            if (personagemContainer && personagemTemplate) {
                personagemContainer.innerHTML = personagemTemplate.innerHTML;
            }
        } else {
            resetToSingleSelect();
        }

        // Initialize components
        initPersonagemHandlers();
        initMentions();

        // Scroll to form
        if (formContainer) {
            const offset = formContainer.getBoundingClientRect().top + window.pageYOffset - 300;
            window.scrollTo({ top: offset, behavior: 'smooth' });
        }


        // Cancel button handler
        const cancelButton = document.getElementById('cancelaForm');
        if (cancelButton) {
            cancelButton.replaceWith(cancelButton.cloneNode(true)); // Remove existing listeners
            cancelButton.addEventListener('click', () => setFormState('idle', 0));
        }

    } else {
        const showFormButton = document.getElementById('showForm');
        if (showFormButton) showFormButton.style.display = '';
    }
    state.update(modo, referenceRowId);
}








function setFormState(modo, referenceRowId) {
    const { modo: currentModo, referenceRowId: currentRowId } = state;
    const referenceRow = $$$(`tr[data-id="$$${referenceRowId}"]`);

    // Cleanup previous state
    if (currentModo === 'edit' && currentRowId !== referenceRowId) {
        $$$(`tr[data-id="$$${currentRowId}"]`).style.display = '';
    }
    document.querySelectorAll('.form-container, #formFeedback').forEach(el => el.remove());

    if (modo === 'idle') {
        $$$('#showForm').style.display = '';
        state.update('idle', 0);
        return;
    }

    // Create new form
    const formContainer = createElement('tr', { className: 'form-container' });
    formContainer.innerHTML = `<td colspan="3">$$${$$$('#formTemplate').innerHTML}</td>`;

    // Position form
    const table = $$$('.tabela');
    if (modo === 'create') {
        $$$('#showForm').style.display = 'none';
        table.appendChild(formContainer);
    } else {
        $$$('#showForm').style.display = '';
        referenceRow[modo === 'above' ? 'before' : 'after'](formContainer);
        if (modo === 'edit') referenceRow.style.display = 'none';
    }

    // Initialize components
    initPersonagemHandlers();
    initMentions();
    formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Form cancel handler
    $$$('#cancelaForm').onclick = () => setFormState('idle', 0);
    state.update(modo, referenceRowId);
}


















$(document).on('click', '.delete-instruction', function () {
    if (!confirm('Tem certeza que deseja excluir esta instrução?')) {
        return;
    }

    const instructionId = $(this).data('id');
    const $row = $(this).closest('tr[data-id]');
    const token = $('meta[name="__RequestVerificationToken"]').attr('content');

    $.ajax({
        url: '/Roteiros/DeletaInstrucao',
        type: 'POST',
        data: JSON.stringify({ id: instructionId }),
        contentType: 'application/json',
        headers: {
            'RequestVerificationToken': token
        },
        success: function (response) {
            if (response.success) {
                $row.fadeOut(300, function () {
                    $(this).remove();
                    // Re-number remaining instructions
                    $('.lista-instrucoes tr[data-id] .js-ordem').each(function (index) {
                        $(this).text(index + 1);
                    });
                });
            } else {
                alert('Erro ao excluir: ' + response.message);
            }
        },
        error: function (xhr) {
            alert('Erro: ' + xhr.status + ' - ' + xhr.responseText);
        }
    });
});





















// Handle delete instruction button clicks
$(document).on('click', '.delete-instruction', function () {
    if (!confirm('Tem certeza que deseja excluir esta instrução?')) {
        return;
    }

    const instructionId = $(this).data('id');
    const $row = $(this).closest('tr[data-id]');

    $.ajax({
        url: '/Roteiros/DeletaInstrucao',
        type: 'POST',
        data: {
            id: instructionId,
            __RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
        },
        success: function (response) {
            if (response.success) {
                // Remove the row from the table
                $row.remove();

                // Re-number the remaining instructions
                $('.lista-instrucoes tr[data-id] .js-ordem').each(function (index) {
                    $(this).text(index + 1);
                });
            } else {
                alert('Erro ao excluir: ' + response.message);
            }
        },
        error: function () {
            alert('Erro ao conectar com o servidor');
        }
    });
});


//#region -- TESTS
async function checkDuplicate(instrucaoId, personagemId, tipo) { // Call this when a personagem is selected
    const response = await fetch(`/Roteiros/CheckForDuplicates?instrucaoId=${instrucaoId}&personagemId=${personagemId}&tipo=${tipo}`);
    const data = await response.json(); if (data.isDuplicate) { showToastWarning("Este personagem já está vinculado com este tipo de participação."); }
}
//#endregion -- TESTS

//#region MOVE
function moveInstruction(id, direction) {
    const row = $(`tr[data-id="${id}"]`);
    const currentOrder = parseInt(row.find('.js-ordem').text());
    const swapRow = direction === 'up'
        ? row.prev()
        : row.next();

    if (swapRow.length) {
        const swapOrder = parseInt(swapRow.find('.js-ordem').text());

        // Update UI immediately
        row.find('.js-ordem').text(swapOrder);
        swapRow.find('.js-ordem').text(currentOrder);

        // Update backend
        $.post('/Roteiros/ReorderInstructions', {
            cenaId: $('#instrucaoForm input[name="CenaId"]').val(),
            newOrder: {
                [id]: swapOrder,
                [swapRow.data('id')]: currentOrder
            }
        });
    }
}
// Event handlers:
$(document).on('click', '.move-up', function () {
    moveInstruction($(this).data('id'), 'up');
});

$(document).on('click', '.move-down', function () {
    moveInstruction($(this).data('id'), 'down');
});
//#endregion MOVE

//#region PERSONAGEM SUBMIT
function preparePersonagemData() {
    const personagemData = [];
    const mainSelect = $('select[name="personagemIds[]"]').first(); // Only check the first/main select
    if (!mainSelect.length) return personagemData;
    const selectedValue = mainSelect.find('option:selected').val();
    // Handle "All"
    if (selectedValue === "-1") {
        personagemData.push({ name: 'personagemIds[]', value: '-1' });
    }
    // Handle "All except"
    else if (selectedValue === "-2") {
        personagemData.push({ name: 'personagemIds[]', value: '-2' });
        $('select[name="personagemIds[]"]').not(':first').find('option:selected').each(function () {
            const val = $(this).val();
            if (val > 0) personagemData.push({ name: 'personagemIds[]', value: val });
        });
    }
    // Handle normal selection
    else {
        $('select[name="personagemIds[]"] option:selected').each(function () {
            const val = $(this).val();
            if (val > 0) personagemData.push({ name: 'personagemIds[]', value: val });
        });
    }
    return personagemData;
}
//#endregion PERSONAGEM SUBMIT
