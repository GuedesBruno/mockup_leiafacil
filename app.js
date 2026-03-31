// app.js - Lógica do Mockup LeiaFácil

// -------------------------
// Estado Global e LocalStorage
// -------------------------
const accessibilityPresets = [
    { id: 'preset_padrao', name: 'Padrão', isPreset: true, configs: { fontFamily: 'Arial, sans-serif', fontSize: '24px', colorFundo: '#FFFFFF', colorLetra: '#000000', destacar: false, colorDestaque: '#FFFF00', colorTextoDestaque: '#000000', useMascara: false, useLinha: false, ativarVoz: 'sim' } },
    { id: 'preset_tea', name: 'TEA', isPreset: true, configs: { fontFamily: 'Arial, sans-serif', fontSize: '24px', colorFundo: '#E3F2FD', colorLetra: '#0747A6', destacar: true, colorDestaque: '#FFFF00', colorTextoDestaque: '#000000', useMascara: false, useLinha: true, ativarVoz: 'sim' } },
    { id: 'preset_tdah', name: 'TDAH', isPreset: true, configs: { fontFamily: 'Arial, sans-serif', fontSize: '24px', colorFundo: '#F1F8E9', colorLetra: '#33691E', destacar: true, colorDestaque: '#AED581', colorTextoDestaque: '#000000', useMascara: true, useLinha: true, ativarVoz: 'sim' } },
    { id: 'preset_dislexia', name: 'Dislexia', isPreset: true, configs: { fontFamily: 'OpenDyslexic, sans-serif', fontSize: '28px', colorFundo: '#FFFDE7', colorLetra: '#000000', destacar: false, colorDestaque: '#FFFF00', colorTextoDestaque: '#000000', useMascara: false, useLinha: true, ativarVoz: 'sim' } },
    { id: 'preset_baixa_visao', name: 'Baixa Visão', isPreset: true, configs: { fontFamily: 'Arial, sans-serif', fontSize: '36px', colorFundo: '#000000', colorLetra: '#FFFFFF', destacar: true, colorDestaque: '#FFFF00', colorTextoDestaque: '#000000', useMascara: false, useLinha: false, ativarVoz: 'sim' } },
    { id: 'preset_cegueira', name: 'Cegueira', isPreset: true, configs: { fontFamily: 'Arial, sans-serif', fontSize: '24px', colorFundo: '#000000', colorLetra: '#FFFFFF', destacar: false, colorDestaque: '#FFFF00', colorTextoDestaque: '#000000', useMascara: false, useLinha: false, ativarVoz: 'sim' } }
];

const defaultState = {
    activeProfileId: 'preset_padrao',
    activeProfileName: 'Padrão',
    brailleConnected: false,
    profiles: []
};


function loadState() {
    const saved = localStorage.getItem('leiafacil_state');
    let state = saved ? JSON.parse(saved) : { ...defaultState };

    // Migração de cache: Limpar perfis hardcoded antigos do localStorage do usuário
    const legacyIds = ['padrao', 'tdah', 'tea', 'dislexia', 'joao'];
    if (state.profiles) {
        state.profiles = state.profiles.filter(p => !legacyIds.includes(p.id));
    }
    
    // Fallback se o ativo era um legado excluído
    if (legacyIds.includes(state.activeProfileId)) {
        state.activeProfileId = 'preset_padrao';
        state.activeProfileName = 'Padrão LeiaFácil';
    }
    
    return state;
}

function saveState(state) {
    localStorage.setItem('leiafacil_state', JSON.stringify(state));
}

let appState = loadState();

function setActiveProfile(id, name) {
    appState.activeProfileId = id;
    appState.activeProfileName = name;
    saveState(appState);
    applyGlobalState();

    // Se estiver na tela inicial, navegar automaticamente para a Tela Principal
    const menuScreen = document.getElementById('screen-menu');
    if (menuScreen && menuScreen.classList.contains('view-active')) {
        showScreen('screen-escanear');
    }
}

function applyGlobalState() {
    // Atualiza rótulo no botão de perfil do header (preserva estrutura HTML)
    const btnPerfilLabel = document.getElementById('btn-perfil-label');
    if (btnPerfilLabel) {
        btnPerfilLabel.textContent = appState.activeProfileName;
    }

    if(typeof renderProfileLists === 'function') renderProfileLists();
    if(typeof renderUserListHome === 'function') renderUserListHome();
    if(typeof renderHeaderProfileList === 'function') renderHeaderProfileList();

    // Destaque para Presets
    const presetBtns = document.querySelectorAll('.btn-preset');
    presetBtns.forEach(btn => {
        const btnText = btn.innerText.trim().toUpperCase();
        if(btnText === appState.activeProfileName.toUpperCase()) {
            btn.classList.add('active-profile');
        } else {
            btn.classList.remove('active-profile');
        }
    });

    // Destaque para botão Usuário se o perfil ativo for um customizado
    const btnHomeUser = document.getElementById('btn-home-usuario');
    if (btnHomeUser) {
        const isCustom = appState.profiles.some(p => p.id === appState.activeProfileId);
        if (isCustom) {
            btnHomeUser.classList.add('active-profile');
            btnHomeUser.innerHTML = `<span class="icon btn-user-dashed"><img src="icones/icone_perfil_mais.png" alt="Usuário"></span> <span class="btn-preset-label">${appState.activeProfileName}</span>`;
        } else {
            btnHomeUser.classList.remove('active-profile');
            btnHomeUser.innerHTML = `<span class="icon btn-user-dashed"><img src="icones/icone_perfil_mais.png" alt="Usuário"></span> <span class="btn-preset-label">USUÁRIO</span>`;
        }
    }

    let p = appState.profiles.find(x => x.id === appState.activeProfileId);
    if (!p) p = accessibilityPresets.find(x => x.id === appState.activeProfileId);

    if(p && p.configs) {
        document.documentElement.style.setProperty('--doc-bg', p.configs.colorFundo);
        document.documentElement.style.setProperty('--doc-text', p.configs.colorLetra);
        document.documentElement.style.setProperty('--doc-font', p.configs.fontFamily);
        document.documentElement.style.setProperty('--doc-size', p.configs.fontSize);
        
        const m = document.getElementById('overlay-mascara');
        const lg = document.getElementById('overlay-linha-guia');
        
        // Suporta tanto o formato legado (useMascara/useLinha) quanto o novo (mascaraTelaInteira etc.)
        let ativoMascara, ativoLinha;
        if (p.configs.tipoLeitura === 'leitura_linha') {
            ativoMascara = 'mascaraLeituraLinha' in p.configs ? p.configs.mascaraLeituraLinha : p.configs.useMascara;
            ativoLinha   = 'linhaLeituraLinha'   in p.configs ? p.configs.linhaLeituraLinha   : p.configs.useLinha;
        } else {
            ativoMascara = 'mascaraTelaInteira' in p.configs ? p.configs.mascaraTelaInteira : p.configs.useMascara;
            ativoLinha   = 'linhaTelaInteira'   in p.configs ? p.configs.linhaTelaInteira   : p.configs.useLinha;
        }

        if(m)  { ativoMascara ? m.classList.remove('hidden')  : m.classList.add('hidden'); }
        if(lg) { ativoLinha   ? lg.classList.remove('hidden') : lg.classList.add('hidden'); }

        // Lógica de Cegueira / Linha Braille
        const toggleVoz = document.getElementById('cfg-ativar-voz');
        if (toggleVoz) {
            if (appState.activeProfileId === 'preset_cegueira' && !appState.brailleConnected) {
                toggleVoz.checked = true;
                toggleVoz.disabled = true;
                toggleVoz.closest('.switch').style.opacity = '0.5';
                toggleVoz.closest('.switch').title = "Áudio obrigatório sem Linha Braille conectada";
            } else {
                toggleVoz.disabled = false;
                toggleVoz.closest('.switch').style.opacity = '1';
                toggleVoz.closest('.switch').title = "";
                // Aplica o valor salvo no perfil
                toggleVoz.checked = (p.configs.ativarVoz === 'sim');
            }
        }
    }
}
window.addEventListener('DOMContentLoaded', () => {
    applyGlobalState();
    setTimeout(startWelcomeSequence, 500); // Pequeno delay para garantir foco
});

function startWelcomeSequence() {
    playStartupSound();
    animateText("welcome-title", "Bem-vindo ao LeiaFácil!", 50, () => {
        animateText("welcome-subtitle", "Digitalizador inteligente, multissensorial e multideficiência!", 30);
    });
}

function animateText(elementId, text, speed, callback) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = "";
    let i = 0;
    const timer = setInterval(() => {
        if (i < text.length) {
            el.textContent += text[i];
            i++;
        } else {
            clearInterval(timer);
            if (callback) callback();
        }
    }, speed);
}

function playStartupSound() {
    // Sintetiza um som agradável (Bar Chimes / Bell effect) usando Web Audio API
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioCtx.currentTime;
        
        const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        frequencies.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + (index * 0.1));
            
            gain.gain.setValueAtTime(0, now + (index * 0.1));
            gain.gain.linearRampToValueAtTime(0.2, now + (index * 0.1) + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (index * 0.1) + 1.5);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start(now + (index * 0.1));
            osc.stop(now + (index * 0.1) + 1.5);
        });
    } catch (e) {
        console.warn("Audio Context não suportado ou bloqueado pelo navegador.");
    }
}


function renderProfileLists() {
    const listSel = document.getElementById('lista-selecionar-perfil');
    const listGer = document.getElementById('lista-gerenciar-perfil');
    if(!listSel || !listGer) return;

    const buildHtml = (p) => {
        const isActive = (p.id === appState.activeProfileId) ? 'active' : '';
        const isChecked = (p.id === appState.activeProfileId) ? 'checked' : '';
        return `
            <label class="profile-item-modern ${isActive}">
                <input type="radio" name="perfil-selecionar" value="${p.id}|${p.name}" data-preset="${p.isPreset===true}" ${isChecked}>
                ${p.name}
            </label>
        `;
    };

    const buildHtmlGer = (p) => {
        const isPreset = p.isPreset === true;
        return `
            <label class="profile-item-modern">
                <input type="radio" name="perfil-gerenciar" value="${p.id}|${p.name}" data-preset="${isPreset}">
                ${p.name}
            </label>
        `;
    };

    let selHtml = '<div style="margin-bottom:15px; font-weight:bold; color:#555;">Meus Perfis (Customizados)</div>';
    let gerHtml = '<div style="margin-bottom:15px; font-weight:bold; color:#555;">Meus Perfis (Customizados)</div>';
    
    if(appState.profiles.length === 0) {
        selHtml += '<div style="color:#aaa; text-align:center; padding: 10px; font-style:italic;">Nenhum perfil criado.</div>';
        gerHtml += '<div style="color:#aaa; text-align:center; padding: 10px; font-style:italic;">Nenhum perfil criado.</div>';
    } else {
        appState.profiles.forEach(p => { selHtml += buildHtml(p); gerHtml += buildHtmlGer(p); });
    }


    // Presets aparecem APENAS na tela principal, não nos modais.

    listSel.innerHTML = selHtml;
    listGer.innerHTML = gerHtml;

    listSel.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('change', () => {
            listSel.querySelectorAll('.profile-item-modern').forEach(lbl => lbl.classList.remove('active'));
            inp.closest('.profile-item-modern').classList.add('active');
        });
    });
    listGer.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('change', () => {
            listGer.querySelectorAll('.profile-item-modern').forEach(lbl => lbl.classList.remove('active'));
            inp.closest('.profile-item-modern').classList.add('active');
            
            const isPreset = inp.dataset.preset === 'true';
            const btnEditar = document.getElementById('btn-editar-perfil');
            const btnExcluir = document.getElementById('btn-excluir-perfil');
            if(btnEditar) btnEditar.innerText = isPreset ? "Usar como base (Criar Novo)" : "Editar Perfil Selecionado";
            if(btnExcluir) {
                btnExcluir.disabled = isPreset;
                btnExcluir.style.opacity = isPreset ? '0.5' : '1';
                btnExcluir.style.cursor = isPreset ? 'not-allowed' : 'pointer';
            }
        });
    });
}

function confirmarMenuSelecao() {
    const checked = document.querySelector('input[name="perfil-selecionar"]:checked');
    if(checked) {
        const parts = checked.value.split('|');
        setActiveProfile(parts[0], parts[1]);
    }
    document.getElementById('modal-selecionar-perfil').classList.add('hidden');
}

// -------------------------
// Navegação Básica da SPA
// -------------------------
function showScreen(screenId) {
    // Esconder todas as telas
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('view-active'));
    
    // Mostrar a tela solicitada
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('view-active');

    // Scroll para o topo ao trocar de tela (exceto se for config, que tem scroll interno)
    if (screenId !== 'screen-config-unified') {
        window.scrollTo(0, 0);
    }
}

function scrollToSettingsBlock(blockId) {
    const block = document.getElementById(blockId);
    const container = document.querySelector('.settings-content');
    if (!block || !container) return;

    // Rolar o container interno até o bloco
    container.scrollTo({
        top: block.offsetTop - 20,
        behavior: 'smooth'
    });

    // Marcar item ativo na sidebar de config
    document.querySelectorAll('.settings-sidebar-item').forEach(item => {
        if (item.getAttribute('onclick').includes(blockId)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Garantir que o bloco esteja expandido se usarmos o sistema de toggle
    block.classList.add('expanded');
}

function toggleSettingsBlock(blockId) {
    const block = document.getElementById(blockId);
    if (!block) return;
    block.classList.toggle('expanded');
}

function atualizarConfig(tipo, valor) {
    console.log(`Atualizando config: ${tipo} -> ${valor}`);
    // Aqui entrará a lógica para salvar no perfil ativo
    if (tipo === 'voz') {
        appState.ativarVoz = valor ? 'sim' : 'nao';
    }
    saveState(appState);
    // Aplicar mudanças visuais se necessário
    applyGlobalState();
}

// -------------------------
// Lógica do Perfil
// -------------------------
document.getElementById('btn-perfil').addEventListener('click', () => {
    document.getElementById('modal-selecionar-perfil').classList.remove('hidden');
});

// -------------------------
// Wizard de Criação (5 Etapas)
// -------------------------
let currentStep = 1;
let currentSubStep4 = 1;
const totalSteps = 5;
let editingProfileId = null;

function excluirPerfilSelecionado() {
    const selected = document.querySelector('input[name="perfil-gerenciar"]:checked');
    if (!selected) return alert('Selecione um perfil primeiro.');
    const id = selected.value.split('|')[0];
    const isPreset = selected.dataset.preset === 'true';

    if (isPreset) return alert('Não é possível excluir perfis pré-prontos.');

    if (confirm(`Tem certeza que deseja excluir este perfil?`)) {
        appState.profiles = appState.profiles.filter(p => p.id !== id);
        if (appState.activeProfileId === id) {
            appState.activeProfileId = 'preset_padrao';
            appState.activeProfileName = 'Padrão LeiaFácil';
        }
        saveState(appState);
        applyGlobalState();
    }
}

function editarPerfilSelecionado() {
    const selected = document.querySelector('input[name="perfil-gerenciar"]:checked');
    if (!selected) return alert('Selecione um perfil primeiro.');
    const id = selected.value.split('|')[0];
    const isPreset = selected.dataset.preset === 'true';
    
    let pInfo = appState.profiles.find(p => p.id === id) || accessibilityPresets.find(p => p.id === id);
    if (!pInfo) return;

    if(pInfo.configs) {
        if(document.getElementById('tipo-fonte')) document.getElementById('tipo-fonte').value = pInfo.configs.fontFamily;
        if(document.getElementById('tamanho-fonte')) document.getElementById('tamanho-fonte').value = parseInt(pInfo.configs.fontSize) || 24;
        
        const fd = document.querySelector(`input[name="cw-wiz-fundo"][value="${pInfo.configs.colorFundo}"]`);
        if(fd) fd.checked = true;
        updateWizardLetterColors();
        
        const lr = document.querySelector(`input[name="cw-wiz-letra"][value="${pInfo.configs.colorLetra}"]`);
        if(lr) lr.checked = true;

        if(pInfo.configs.destacar) { 
            const sim = document.getElementById('wiz-destaque-sim');
            if(sim) { sim.checked = true; sim.dispatchEvent(new Event('change')); }
        } else { 
            const nao = document.getElementById('wiz-destaque-nao');
            if(nao) { nao.checked = true; nao.dispatchEvent(new Event('change')); }
        }
        
        const cd = document.querySelector(`input[name="cw-wiz-contorno"][value="${pInfo.configs.colorDestaque}"]`);
        if(cd) cd.checked = true;
        const ctd = document.querySelector(`input[name="cw-wiz-interna"][value="${pInfo.configs.colorTextoDestaque}"]`);
        if(ctd) ctd.checked = true;
        
        if(pInfo.configs.tipoLeitura === 'leitura_linha') {
            const rdLl = document.getElementById('wiz-rd-leitura-linha');
            if(rdLl) { rdLl.checked = true; rdLl.dispatchEvent(new Event('change')); }
        } else {
            const rdTi = document.getElementById('wiz-rd-tela-inteira');
            if(rdTi) { rdTi.checked = true; rdTi.dispatchEvent(new Event('change')); }
        }

        if(document.getElementById('chk-mascara-ti')) document.getElementById('chk-mascara-ti').checked = pInfo.configs.mascaraTelaInteira || false;
        if(document.getElementById('chk-linha-ti')) document.getElementById('chk-linha-ti').checked = pInfo.configs.linhaTelaInteira || false;
        if(document.getElementById('chk-mascara-ll')) document.getElementById('chk-mascara-ll').checked = pInfo.configs.mascaraLeituraLinha || false;
        if(document.getElementById('chk-linha-ll')) document.getElementById('chk-linha-ll').checked = pInfo.configs.linhaLeituraLinha || false;
    }

    editingProfileId = isPreset ? null : id;
    document.getElementById('perfil-nome').value = isPreset ? pInfo.name + " (Cópia)" : pInfo.name;

    startProfileWizard(); 
}

function startProfileWizard() {
    const ms = document.getElementById('modal-selecionar-perfil');
    if(ms) ms.classList.add('hidden');
    const mg = document.getElementById('modal-gerenciar-perfil');
    if(mg) mg.classList.add('hidden');

    document.getElementById('modal-wizard').classList.remove('hidden');
    currentStep = 1;
    currentSubStep4 = 1;

    // Popula cores e reseta o destaque se for a primeira vez
    if(typeof populateWizardColors === 'function') populateWizardColors();
    
    updateWizardUI();
}

function updateWizardUI() {
    document.getElementById('wizard-title').innerText = `Criar Perfil - Etapa ${currentStep}/${totalSteps}`;
    
    document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('view-active'));
    document.getElementById(`w-step-${currentStep}`).classList.add('view-active');

    const btnVoltar = document.getElementById('btn-voltar');
    const btnAvancar = document.getElementById('btn-avancar');

    if (currentStep === 1) {
        btnVoltar.classList.add('hidden');
    } else {
        btnVoltar.classList.remove('hidden');
    }

    if (currentStep === totalSteps) {
        btnAvancar.innerText = "Concluir";
    } else {
        btnAvancar.innerText = "Avançar";
    }

    if (currentStep === 2) applyAudioState();
    if (currentStep === 3) updatePreview();

    if (currentStep === 4) {
        document.getElementById('w-step-4-1').classList.add('hidden');
        document.getElementById('w-step-4-2').classList.add('hidden');
        document.getElementById('w-step-4-3').classList.add('hidden');
        document.getElementById('w-step-4-4').classList.add('hidden');
        document.getElementById(`w-step-4-${currentSubStep4}`).classList.remove('hidden');
    }
}

// O bloqueio de cores agora é dinâmico e impede erros diretos na Etapa 4
function nextStep() {
    if (currentStep === 1) {
        const vozes = document.querySelector('input[name="ativar_voz"]:checked');
        if (vozes && vozes.value === 'nao') {
            currentStep = 3;
            updateWizardUI();
            return;
        }
    }

    if (currentStep === 4) {
        if (currentSubStep4 === 1) {
            updateWizardLetterColors();
            currentSubStep4++;
            updateWizardUI();
            return;
        } else if (currentSubStep4 === 2) {
            currentSubStep4++;
            updateWizardUI();
            return;
        } else if (currentSubStep4 === 3) {
            const destacar = document.querySelector('input[name="destacar_texto"]:checked');
            if(destacar && destacar.value === 'nao') {
                currentStep++;
                currentSubStep4 = 1;
                updateWizardUI();
                return;
            } else {
                currentSubStep4++;
                updateWizardUI();
                return;
            }
        } else if (currentSubStep4 === 4) {
            currentStep++;
            currentSubStep4 = 1;
            updateWizardUI();
            return;
        }
    }

    if (currentStep < totalSteps) {
        currentStep++;
        currentSubStep4 = 1;
        updateWizardUI();
    } else {
        const inputNome = document.getElementById('perfil-nome');
        let pnome = inputNome ? inputNome.value.trim() : "";
        
        if (!pnome) {
            // Lógica de auto-nomeação sequencial
            const count = appState.profiles.filter(p => p.name.startsWith("Perfil do Usuário")).length;
            pnome = `Perfil do Usuário ${count + 1}`;
        }
        
        if (!appState.profiles) {
            appState.profiles = [];
        }

        const configData = {
           fontFamily: document.getElementById('tipo-fonte') ? document.getElementById('tipo-fonte').value : 'Arial, sans-serif',
           fontSize: document.getElementById('tamanho-fonte') ? document.getElementById('tamanho-fonte').value + 'px' : '24px',
           colorFundo: document.querySelector('input[name="cw-wiz-fundo"]:checked')?.value || '#FFFFFF',
           colorLetra: document.querySelector('input[name="cw-wiz-letra"]:checked')?.value || '#000000',
           destacar: document.querySelector('input[name="destacar_texto"]:checked')?.value === 'sim',
           colorDestaque: document.querySelector('input[name="cw-wiz-contorno"]:checked')?.value || '#FFFF00',
           colorTextoDestaque: document.querySelector('input[name="cw-wiz-interna"]:checked')?.value || '#000000',
           tipoLeitura: document.querySelector('input[name="tipo_leitura"]:checked')?.value || 'tela_inteira',
           mascaraTelaInteira: document.getElementById('chk-mascara-ti')?.checked || false,
           linhaTelaInteira: document.getElementById('chk-linha-ti')?.checked || false,
           mascaraLeituraLinha: document.getElementById('chk-mascara-ll')?.checked || false,
           linhaLeituraLinha: document.getElementById('chk-linha-ll')?.checked || false,
           ativarVoz: document.querySelector('input[name="ativar_voz"]:checked')?.value || 'sim'
        };

        if (editingProfileId) {
            // Se estiver editando um PRESET, cria um NOVO perfil de usuário (Usar como base)
            const isEditingPreset = accessibilityPresets.some(p => p.id === editingProfileId);
            
            if (isEditingPreset) {
                const pid = 'profile_' + Date.now();
                appState.profiles.push({ id: pid, name: pnome, configs: configData });
                appState.activeProfileId = pid;
                appState.activeProfileName = pnome;
            } else {
                const up = appState.profiles.find(x => x.id === editingProfileId);
                if (up) {
                    up.name = pnome;
                    up.configs = configData;
                }
                appState.activeProfileId = up.id;
                appState.activeProfileName = up.name;
            }
        } else {
            const pid = 'profile_' + Date.now();
            appState.profiles.push({ id: pid, name: pnome, configs: configData });
            appState.activeProfileId = pid;
            appState.activeProfileName = pnome;
        }

        saveState(appState);
        applyGlobalState();
        editingProfileId = null;

        alert(`Perfil "${pnome}" salvo com sucesso!`);
        document.getElementById('modal-wizard').classList.add('hidden');
    }
}

function prevStep() {
    if (currentStep === 4 && currentSubStep4 > 1) {
        currentSubStep4--;
        updateWizardUI();
        return;
    }

    if (currentStep > 1) {
        if (currentStep === 3) {
            const vozes = document.querySelector('input[name="ativar_voz"]:checked');
            if (vozes && vozes.value === 'nao') {
                currentStep = 1;
                updateWizardUI();
                return;
            }
        }

        currentStep--;
        if (currentStep === 4) {
            const destacar = document.querySelector('input[name="destacar_texto"]:checked');
            if(destacar && destacar.value === 'nao') {
                currentSubStep4 = 3;
            } else {
                currentSubStep4 = 4;
            }
        }
        updateWizardUI();
    }
}

// --- Regras de Negócio do Wizard --- //

function applyAudioState() {
    const vozes = document.getElementsByName('ativar_voz');
    let isVoiceActive = true;
    for (let r of vozes) { if(r.checked && r.value === 'sim') isVoiceActive = true; if(r.checked && r.value === 'nao') isVoiceActive = false; }
    
    const audioGroup = document.getElementById('audio-settings-group');
    if (!isVoiceActive) {
        audioGroup.classList.add('disabled');
        Array.from(audioGroup.querySelectorAll('input, select')).forEach(el => el.disabled = true);
    } else {
        audioGroup.classList.remove('disabled');
        Array.from(audioGroup.querySelectorAll('input, select')).forEach(el => el.disabled = false);
    }
}

const tipoFonteSelect = document.getElementById('tipo-fonte');
const tamanhoFonteInput = document.getElementById('tamanho-fonte');
const previewText = document.getElementById('preview-text');
function updatePreview() {
    previewText.style.fontFamily = tipoFonteSelect.value;
    previewText.style.fontSize = tamanhoFonteInput.value + 'px';
}
tipoFonteSelect.addEventListener('change', updatePreview);
tamanhoFonteInput.addEventListener('input', updatePreview);

// Nova lógica dinámica populada pelo cwColors será disparada ao iniciar a interface.
// As regras abaixo servem para o "Tipo de Leitura" na Etapa 5

// Lógica original de bloqueio da máscara e linha (applyScreenTypeLogic) foi DELETADA de acordo com nova regra de negócio, permitindo ativar ambas na Leitura em Linha.
document.querySelectorAll('input[name="tipo_leitura"]').forEach(el => {
    el.addEventListener('change', (e) => {
        if(e.target.value === 'leitura_linha') {
            document.getElementById('toggles-tela-inteira')?.classList.add('hidden');
            document.getElementById('toggles-leitura-linha')?.classList.remove('hidden');
        } else {
            document.getElementById('toggles-leitura-linha')?.classList.add('hidden');
            document.getElementById('toggles-tela-inteira')?.classList.remove('hidden');
        }
    });
});


// ---------------------------------------------------------------- //
// Regras de Negócio das Telas Standalone de CONFIGURAÇÕES          //
// ---------------------------------------------------------------- //

// 1. Áudio (Ativar/Desativar bloqueia os outros selects da tela de config de audio)
const chkCfgAtivarVoz = document.getElementById('cfg-ativar-voz');
const cfgAudioGroup = document.getElementById('cfg-audio-group');

if (chkCfgAtivarVoz && cfgAudioGroup) {
    chkCfgAtivarVoz.addEventListener('change', (e) => {
        const isActive = e.target.checked;
        const inputs = cfgAudioGroup.querySelectorAll('input, select');
        if (!isActive) {
            cfgAudioGroup.classList.add('disabled');
            cfgAudioGroup.style.opacity = '0.5';
            inputs.forEach(el => el.disabled = true);
        } else {
            cfgAudioGroup.classList.remove('disabled');
            cfgAudioGroup.style.opacity = '1';
            inputs.forEach(el => el.disabled = false);
        }
    });
}
// 3. Contraste (Exibe o botão de personalizar apenas no item que está marcado)
function applyCfgContrasteLogic() {
    const labels = document.querySelectorAll('.cfg-contraste-label');
    labels.forEach(lbl => {
        const radio = lbl.querySelector('input[type="radio"]');
        const wrapper = lbl.querySelector('.contraste-personalizar-wrapper');
        
        if (radio && wrapper) {
            if (radio.checked) {
                wrapper.classList.remove('hidden');
                lbl.style.borderColor = '#4CAF50';
                lbl.style.backgroundColor = '#f0fff0';
            } else {
                wrapper.classList.add('hidden');
                lbl.style.borderColor = '#ccc';
                lbl.style.backgroundColor = 'transparent';
            }
        }
    });
}
document.querySelectorAll('input[name="cfg-contraste"]').forEach(el => el.addEventListener('change', applyCfgContrasteLogic));
// Ativa na inicialização para o radio padrão
applyCfgContrasteLogic();

// ---------------------------------------------------------------- //
// WIZARD INTERATIVO DE CONTRASTE (Cores)                           //
// ---------------------------------------------------------------- //
const cwColors = [
    { name: "Preto", hex: "#000000" },
    { name: "Amarelo", hex: "#FFEB3B" },
    { name: "Vermelho", hex: "#F44336" },
    { name: "Azul", hex: "#2196F3" },
    { name: "Verde", hex: "#4CAF50" },
    { name: "Roxo", hex: "#9C27B0" },
    { name: "Marrom", hex: "#795548" },
    { name: "Laranja", hex: "#FF9800" },
    { name: "Bege", hex: "#F5F5DC" },
    { name: "Branco", hex: "#FFFFFF" }
];

function wizGenerateColorHTML(inputName, excludeHex = null) {
    let html = '';
    cwColors.forEach(c => {
        if (excludeHex && c.hex === excludeHex) return;
        html += `
            <label class="wizard-color-item">
                <input type="radio" name="${inputName}" value="${c.hex}">
                <div class="wizard-color-box" style="background-color: ${c.hex};"></div>
                <strong>${c.name}</strong>
            </label>
        `;
    });
    return html;
}

// --- Wizard Etapa 4 (Contraste) Dinâmico --- //
function populateWizardColors() {
    if(document.getElementById('w-list-fundo')) {
        document.getElementById('w-list-fundo').innerHTML = wizGenerateColorHTML('cw-wiz-fundo');
        document.getElementById('w-list-contorno').innerHTML = wizGenerateColorHTML('cw-wiz-contorno');
        document.getElementById('w-list-interna').innerHTML = wizGenerateColorHTML('cw-wiz-interna');
        
        document.querySelectorAll('input[name="cw-wiz-fundo"]').forEach(r => r.addEventListener('change', updateWizardLetterColors));
        
        const fd = document.querySelector('input[name="cw-wiz-fundo"]');
        if(fd) { fd.checked = true; updateWizardLetterColors(); }
    }
}

function updateWizardLetterColors() {
    const fundoEl = document.querySelector('input[name="cw-wiz-fundo"]:checked');
    if(!fundoEl) return;
    const excludeHex = fundoEl.value;
    
    const objLetra = document.querySelector('input[name="cw-wiz-letra"]:checked');
    const oldChosen = objLetra ? objLetra.value : null;

    document.getElementById('w-list-letra').innerHTML = wizGenerateColorHTML('cw-wiz-letra', excludeHex);
    
    const newOpts = document.querySelectorAll('input[name="cw-wiz-letra"]');
    let restored = false;
    newOpts.forEach(r => { if(r.value === oldChosen) { r.checked = true; restored = true; }});
    if(!restored && newOpts.length > 0) newOpts[0].checked = true;
}

// Lógica de Destacar Texto no Wizard
document.querySelectorAll('input[name="destacar_texto"]').forEach(el => {
    el.addEventListener('change', (e) => {
        const dOpts = document.getElementById('destaque-opcoes');
        const dInterna = document.getElementById('destaque-interna-opcoes');
        if(e.target.value === 'sim') {
            if(dOpts) { dOpts.classList.remove('disabled'); Array.from(dOpts.querySelectorAll('input[type="radio"]')).forEach(s => s.disabled = false); }
            if(dInterna) { dInterna.classList.remove('disabled'); Array.from(dInterna.querySelectorAll('input[type="radio"]')).forEach(s => s.disabled = false); }
        } else {
            if(dOpts) { dOpts.classList.add('disabled'); Array.from(dOpts.querySelectorAll('input[type="radio"]')).forEach(s => s.disabled = true); }
            if(dInterna) { dInterna.classList.add('disabled'); Array.from(dInterna.querySelectorAll('input[type="radio"]')).forEach(s => s.disabled = true); }
        }
    });
});

let cwSelectedFundo = "";

function cwGenerateColorHTML(inputName, excludeHex = null) {
    let html = '';
    cwColors.forEach(c => {
        if (excludeHex && c.hex === excludeHex) return; // Exclui cor
        html += `
            <label class="color-item">
                <input type="radio" name="${inputName}" value="${c.hex}">
                <div class="color-box" style="background-color: ${c.hex};"></div>
                ${c.name}
            </label>
        `;
    });
    return html;
}

// Inicia o Wizard de Contraste
// Atribui essa função AOS BOTÕES dinamicamente (precisamos trocar no HTML também ou no clique via selector global)
function startContrasteWizard() {
    // Popula Lista 1
    document.getElementById('cw-list-fundo').innerHTML = cwGenerateColorHTML('cw-fundo');
    // Marca a primeira como default
    const firstFundo = document.querySelector('input[name="cw-fundo"]');
    if(firstFundo) firstFundo.checked = true;
    showScreen('screen-cw-1');
}

// Para que os botões "Personalizar Cores deste modo" funcionem, ligamos neles
document.querySelectorAll('.contraste-personalizar-wrapper button').forEach(btn => {
    btn.onclick = (e) => {
        e.preventDefault();
        startContrasteWizard();
    };
});

function cwNextStep(stepObj) {
    if (stepObj === 2) {
        // Popula Tela 2 (Letra), excluindo a cor de fundo selcionada
        const f = document.querySelector('input[name="cw-fundo"]:checked');
        if (!f) return alert("Selecione uma cor de fundo!");
        cwSelectedFundo = f.value;
        document.getElementById('cw-list-letra').innerHTML = cwGenerateColorHTML('cw-letra', cwSelectedFundo);
        const firstLetra = document.querySelector('input[name="cw-letra"]');
        if(firstLetra) firstLetra.checked = true;
        showScreen('screen-cw-2');
    }
    if (stepObj === 3) {
        showScreen('screen-cw-3');
    }
    if (stepObj === 5) {
        // Popula Tela 5 (Texto interno do Destaque)
        document.getElementById('cw-list-texto-destaque').innerHTML = cwGenerateColorHTML('cw-destaque-txt');
        const dtxt = document.querySelector('input[name="cw-destaque-txt"]');
        if(dtxt) dtxt.checked = true;
        showScreen('screen-cw-5');
    }
}

function cwProcessDestacar() {
    const destacar = document.querySelector('input[name="cw-destacar"]:checked').value;
    if (destacar === 'nao') {
        alert('Contraste personalizado e salvo com sucesso!');
        showScreen('screen-config-contraste');
    } else {
        // Popula Tela 4 (Contorno do Destaque)
        document.getElementById('cw-list-contorno').innerHTML = cwGenerateColorHTML('cw-contorno');
        const contorno = document.querySelector('input[name="cw-contorno"]');
        if(contorno) contorno.checked = true;
        showScreen('screen-cw-4');
    }
}

// ---------------------------------------------------------------- //
// SIMULAÇÃO DA TELA DO DOCUMENTO ESCANEADO (Barra de ferramentas)  //
// ---------------------------------------------------------------- //
let docZoomLevel = 1.2; // rem (tamanho base padrão)
function simularZoom(dir) {
    const content = document.querySelector('#screen-documento .doc-content');
    if(dir > 0 && docZoomLevel < 6.0) docZoomLevel += 0.2; // Aumentado limite p/ linha
    if(dir < 0 && docZoomLevel > 0.8) docZoomLevel -= 0.2;
    content.style.setProperty('font-size', docZoomLevel + 'rem', 'important');
}

const mockContrastes = [
    { bg: '#ffffff', fg: '#000000' }, // Padrão
    { bg: '#000000', fg: '#ffffff' }, // Modo 1 (Alto Contraste)
    { bg: '#000080', fg: '#ffff00' }, // Modo TEA (Azul e Amarelo)
    { bg: '#F5F5DC', fg: '#000000' }, // Modo Dislexia (Bege e Preto)
];
let docContrasteIdx = 0;
function simularContraste() {
    docContrasteIdx = (docContrasteIdx + 1) % mockContrastes.length;
    const content = document.querySelector('#screen-documento .doc-content');
    content.style.backgroundColor = mockContrastes[docContrasteIdx].bg;
    content.style.color = mockContrastes[docContrasteIdx].fg;
}

function simularLeituraLinha() {
    const content = document.querySelector('#screen-documento .doc-content');
    content.classList.toggle('leitura-linha-ativa');
}

function simularLinhaGuia() {
    document.getElementById('overlay-linha-guia').classList.toggle('hidden');
}

function simularMascara() {
    document.getElementById('overlay-mascara').classList.toggle('hidden');
}


// --- Interações da Tela Inicial (Home) --- //

function toggleUserList() {
    const list = document.getElementById('home-user-list');
    if (list) list.classList.toggle('hidden');
}

function renderUserListHome() {
    const list = document.getElementById('home-user-list');
    if (!list) return;

    if (!appState.profiles || appState.profiles.length === 0) {
        list.innerHTML = '<div class="user-item" style="color:#999; font-style:italic;">Nenhum usuário salvo</div>';
        return;
    }

    list.innerHTML = appState.profiles.map(p => `
        <div class="user-item" onclick="setActiveProfile('${p.id}', '${p.name}'); toggleUserList(); showScreen('screen-escanear');">
            ${p.name}
        </div>
    `).join('');
}

function startAppNow() {
    setActiveProfile('preset_padrao', 'Padrão');
    showScreen('screen-escanear');
}

// Simulador de Linha Braille (para fins de teste no mockup)
function setBrailleConnected(val) {
    appState.brailleConnected = val;
    // Sincroniza ambos os possíveis toggles no mockup
    const label = document.getElementById('braille-status-label');
    if (label) label.innerText = `Linha Braille: ${val ? 'ON' : 'OFF'}`;
    
    const toggleMain = document.getElementById('braille-toggle-main');
    if (toggleMain) toggleMain.checked = val;

    saveState(appState);
    applyGlobalState();
    console.log("Status Linha Braille:", val ? "Conectada" : "Desconectada");
}

// Fecha dropdowns ao clicar fora
window.addEventListener('click', (e) => {
    // Home user dropdown
    const homeWrapper = document.querySelector('.user-profile-wrapper');
    const homeList = document.getElementById('home-user-list');
    if (homeWrapper && !homeWrapper.contains(e.target)) {
        if (homeList) homeList.classList.add('hidden');
    }

    // Header profile dropdown
    const headerWrapper = document.getElementById('header-profile-wrapper');
    const headerList = document.getElementById('header-profile-list');
    if (headerWrapper && !headerWrapper.contains(e.target)) {
        if (headerList) headerList.classList.add('hidden');
    }
});

// --- Header: Dropdown de Perfil --- //

function toggleHeaderProfileList() {
    const list = document.getElementById('header-profile-list');
    if (!list) return;
    const isHidden = list.classList.contains('hidden');
    if (isHidden) {
        renderHeaderProfileList();
        list.classList.remove('hidden');
    } else {
        list.classList.add('hidden');
    }
}

function renderHeaderProfileList() {
    const list = document.getElementById('header-profile-list');
    if (!list) return;

    let html = '';

    // Seção: Perfis de Acessibilidade (Presets)
    html += `<div class="header-profile-item header-separator">Perfis de Acessibilidade</div>`;
    accessibilityPresets.forEach(p => {
        const isActive = appState.activeProfileId === p.id;
        html += `<div class="header-profile-item ${isActive ? 'active-profile' : ''}"
            onclick="setActiveProfile('${p.id}', '${p.name}'); document.getElementById('header-profile-list').classList.add('hidden');">
            ${p.name} ${isActive ? '✓' : ''}
        </div>`;
    });

    // Seção: Perfis de Usuário
    if (appState.profiles && appState.profiles.length > 0) {
        html += `<div class="header-profile-item header-separator">Meus Perfis</div>`;
        appState.profiles.forEach(p => {
            const isActive = appState.activeProfileId === p.id;
            html += `<div class="header-profile-item ${isActive ? 'active-profile' : ''}"
                onclick="setActiveProfile('${p.id}', '${p.name}'); document.getElementById('header-profile-list').classList.add('hidden');">
                ${p.name} ${isActive ? '✓' : ''}
            </div>`;
        });
    }

    list.innerHTML = html;
}

// --- Botão Fechar Programa --- //

// --- Lógica da Nova Tela Principal --- //

function simularEscanear() {
    const area = document.querySelector('#screen-documento .doc-content');
    if (!area) return;

    // Simula o preenchimento da área com texto de exemplo
    area.innerHTML = `
        <h2 style="color: #0056b3;">Documento Digitalizado</h2>
        <p>Este é um exemplo de texto extraído via OCR pelo LeiaFácil.</p>
        <p>O sistema reconheceu o layout e aplicou as configurações do seu perfil ativo.</p>
        <hr>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
    `;
    
    showScreen('screen-documento');
}

function abrirModalEnviar() {
    const modal = document.getElementById('modal-enviar');
    if (modal) modal.classList.remove('hidden');
}
