/* Interpretador local: regras, exemplos aprendidos e nivel de confianca. */
(function () {
    const STOPWORDS = new Set(['a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'um', 'uma', 'para', 'pra', 'me', 'eu', 'que', 'na', 'no', 'em']);
    const EXAMPLES_KEY = 'sexta_feira.interpreter.examples.v1';

    function normalize(text) {
        return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function words(text) {
        return normalize(text).split(' ').filter((word) => word.length > 2 && !STOPWORDS.has(word));
    }

    function similarity(first, second) {
        const a = new Set(words(first));
        const b = new Set(words(second));
        if (!a.size || !b.size) return 0;
        const common = [...a].filter((word) => b.has(word)).length;
        return common / Math.max(a.size, b.size);
    }

    function learnedExamples() {
        try { return JSON.parse(localStorage.getItem(EXAMPLES_KEY) || '[]'); } catch (error) { return []; }
    }

    function saveCorrection(phrase, understoodAs, correctedTo) {
        const examples = learnedExamples();
        examples.unshift({ phrase, intent: correctedTo, previousIntent: understoodAs, createdAt: Date.now() });
        localStorage.setItem(EXAMPLES_KEY, JSON.stringify(examples.slice(0, 100)));
        if (window.SextaStorage) {
            SextaStorage.save('corrections', {
                phrase,
                understood_as: understoodAs,
                corrected_to: correctedTo,
                confidence: 0.85
            });
        }
    }

    function classify(text) {
        const normalized = normalize(text);
        const patterns = [
            { intent: 'criar_tarefa', confidence: 0.93, test: /^(anote|adicionar?|adicione|coloque|registre|me lembre|lembre[- ]me|na minha agenda)/ },
            { intent: 'listar_tarefas', confidence: 0.96, test: /(minhas tarefas|meus compromissos|o que tenho para fazer|quais tarefas)/ },
            { intent: 'pesquisar', confidence: 0.92, test: /(pesquis|busc|procur|achar|na internet|na web)/ },
            { intent: 'salvar_memoria', confidence: 0.97, test: /(salve|guarde|memorize|aprenda) (isso|que|na memoria)/ },
            { intent: 'informar_horario', confidence: 0.98, test: /(que horas|qual o horario|horario atual)/ },
            { intent: 'informar_data', confidence: 0.98, test: /(que dia|qual a data|data de hoje)/ }
        ];
        const learned = learnedExamples()
            .map((example) => ({ ...example, confidence: similarity(text, example.phrase) * 0.9 }))
            .sort((a, b) => b.confidence - a.confidence)[0];
        const direct = patterns.find((pattern) => pattern.test.test(normalized));
        if (learned && learned.confidence >= 0.75 && (!direct || learned.confidence > direct.confidence)) {
            return { intent: learned.intent, confidence: learned.confidence, source: 'learned' };
        }
        return direct ? { intent: direct.intent, confidence: direct.confidence, source: 'rules' } : { intent: 'unknown', confidence: 0.1, source: 'none' };
    }

    window.SextaInterpreter = {
        normalize,
        classify,
        learn: saveCorrection,
        confidenceLabel(confidence) {
            if (confidence >= 0.9) return 'alta';
            if (confidence >= 0.6) return 'media';
            return 'baixa';
        }
    };
})();
