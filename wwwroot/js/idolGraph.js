const BRAND_COLORS = {
    '765PRO AS': '#f34f6d',
    'Cinderella Girls': '#2681c8',
    'Million Live': '#ffc30b',
    'SideM': '#0dba3b',
    'Shiny Colors': '#79c5f0',
    'Gakuen': '#ff8c00',
    'Other': '#ccc'
};

let currentFilter = "All";
let currentMode = "Standard";

const getFCoSEOptions = (random = false) => {
    const isAllMode = (currentFilter === "All");

    return {
        name: 'fcose',
        quality: 'default',
        randomize: random,
        animate: true,
        animationDuration: 1500,
        fit: true,
        padding: 100,
        nodeRepulsion: isAllMode ? 1500000 : 450000,
        gravity: isAllMode ? 0.001 : 0.01,
        tile: true,
        tilingPaddingVertical: isAllMode ? 1000 : 300,
        tilingPaddingHorizontal: isAllMode ? 1000 : 300,

        idealEdgeLength: (edge) => {
            if (edge.hasClass('mutual')) {
                return isAllMode ? 160 : 80;
            }
            let baseLength = 400;
            if (isAllMode) {
                baseLength *= 2;
                // degree() を使い、両想いの統合に関わらず人気度を反映いたします
                const targetPopularity = edge.target().degree() - 4;
                baseLength += (targetPopularity * 20);
            }
            return baseLength;
        },
        numIter: isAllMode ? 15000 : 5000,
        packComponents: true,
    };
};

window.initIdolGraph = (data) => {
    if (window.cyInstance) { window.cyInstance.destroy(); }
    const cyContainer = document.getElementById('cy');
    cyContainer.oncontextmenu = () => false;

    window.cyInstance = cytoscape({
        container: cyContainer,
        elements: data,
        wheelSensitivity: 0.4,
        boxSelectionEnabled: false,
        userPanningEnabled: true,
        style: [
            {
                selector: 'node',
                style: {
                    'width': 'data(baseSize)',
                    'height': 'data(baseSize)',
                    'background-image': 'data(image)',
                    'background-fit': 'cover',
                    'label': 'data(name)',
                    'font-size': '12px', 'text-valign': 'bottom', 'text-margin-y': '8px',
                    'border-width': 6,
                    'border-style': 'solid',
                    'border-color': (node) => BRAND_COLORS[node.data('brand')] || BRAND_COLORS['Other'],
                    'transition-property': 'width, height, border-width, opacity, font-size',
                    'transition-duration': '0.3s'
                }
            },
            {
                selector: 'node.highlight',
                style: {
                    'width': (node) => node.data('baseSize') * 1.15,
                    'height': (node) => node.data('baseSize') * 1.15,
                    'border-width': 12,
                    'z-index': 999,

                    // 演出：お名前を大きく、堂々と掲げますわ
                    'font-size': '32px',          // 12px から大幅に拡大いたします
                    'font-weight': 'bold',
                    'text-margin-y': '16px',      // 文字が大きくなった分、少し下にずらして重なりを防ぎます
                    'text-background-opacity': 0.7, // お名前を読みやすくするため、背後に薄く光を纏わせます
                    'text-background-color': '#ffffff',
                    'text-background-padding': '4px',
                    'text-background-shape': 'roundrectangle'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'arrow-scale': 1.8,
                    'line-color': (edge) => BRAND_COLORS[edge.source().data('brand')] || BRAND_COLORS['Other'],
                    'target-arrow-shape': 'triangle',
                    'target-arrow-color': (edge) => BRAND_COLORS[edge.source().data('brand')] || BRAND_COLORS['Other'],
                    'curve-style': 'bezier',
                    'opacity': 0.6,
                    'transition-property': 'width, opacity, line-color',
                    'transition-duration': '0.3s'
                }
            },
            {
                selector: 'edge.mutual',
                style: {
                    'width': 8,
                    'line-color': '#FF69B4',
                    'target-arrow-color': '#FF69B4',
                    'source-arrow-shape': 'triangle',
                    'source-arrow-color': '#FF69B4',
                    'opacity': 0.9
                }
            },
            {
                selector: 'node.selected-brand-node',
                style: {
                    'border-width': 12, // 通常の6pxから2倍の12pxへ！
                    'z-index': 100,      // 他のノード（通常0）より上に配置いたします
                }
            },
            {
                selector: 'edge.selected-brand-edge',
                style: {
                    'z-index': 50,       // 矢印も、他のブランドのノードよりは下ですが、
                    // 他のブランドの矢印よりは上に表示させますわ
                }
            },
            { selector: 'edge.focus', style: { 'opacity': 1, 'width': 5 } },
            { selector: '.faded', style: { 'opacity': 0.05, 'events': 'no' } }
        ],
        ready: function () {
            const cy = this;
            const nodes = cy.nodes();
            const minSize = 80;
            const maxSize = minSize * 3;
            // ここも degree() でサイズを計算するのがよろしいかと存じます
            const maxDeg = Math.max(...nodes.map(n => n.degree()), 1);
            const scaleFactor = (maxSize - minSize) / Math.sqrt(maxDeg);

            nodes.forEach(node => {
                const bSize = minSize + (Math.sqrt(node.degree()) * scaleFactor);
                node.data('baseSize', bSize);
                node.style({ 'width': bSize, 'height': bSize });
            });
            cy.layout(getFCoSEOptions(true)).run();
            cy.on('cxtdrag', (e) => { cy.panBy({ x: e.originalEvent.movementX, y: e.originalEvent.movementY }); });
        }
    });

    
    // --- アイドルへの接触（タップ）に関する新・作法ですわ ---
    window.cyInstance.on('tap', 'node', (evt) => {
        const node = evt.target;

        // すでにハイライト（指名）されている状態かを判定いたします
        if (node.hasClass('highlight')) {
            // 【二度目のクリック】
            // すでに輝いている彼女をさらに選ぶのは、「もっと知りたい」という愛の証ですわ！
            window.open('https://idollist.idolmaster-official.jp/search/detail/' + node.id(), '_blank');
        } else {
            // 【一度目のクリック】
            // 彼女にスポットライトを当て、舞台の中心へお呼びいたしますわ
            highlightIdol(node);

            // 演出：少しだけ彼女に近づく（ズーム）と、より親密な空気になりますわ
            window.cyInstance.animate({
                center: { eles: node },
                zoom: 1.2
            }, { duration: 400 });
        }
    });

    // 演出：背景をタップした時は、すべてのハイライトを解除し、全体を見渡しますわ
    window.cyInstance.on('tap', function (event) {
        if (event.target === window.cyInstance) {
            clearHighlight();
            window.cyInstance.animate({ fit: { padding: 70 }, duration: 800 });
        }
    });
};

/**
 * 演出補助：統合フィルター（お嬢様の采配を形にいたします）
 */
window.applyComplexFilter = (brand, mode) => {
    if (!window.cyInstance) return;
    const cy = window.cyInstance;
    currentFilter = brand;
    currentMode = mode;

    // 1. まずは全員の「主役クラス」を剥奪し、一度舞台袖へ
    cy.elements().removeClass('selected-brand-node selected-brand-edge');
    cy.elements().hide();

    // 2. 絆（エッジ）の選別
    const relevantEdges = cy.edges().filter(edge => {
        // ... (以前お作りしたフィルタロジック) ...
        const s = edge.source();
        const t = edge.target();
        const sBrand = s.data('brand');
        const tBrand = t.data('brand');
        const isMutual = edge.hasClass('mutual');

        if (brand !== "All") {
            if (sBrand !== brand && tBrand !== brand) return false;
        }
        if (mode === "SameBrandOnly") { if (sBrand !== tBrand) return false; }
        if (mode === "HideSameBrand") { if (sBrand === tBrand) return false; }
        if (mode === "HideFromSelf" && brand !== "All") { if (sBrand === brand && !isMutual) return false; }
        if (mode === "MutualOnly") { return isMutual; }
        return true;
    });

    // 3. 表示するノードの決定
    const relevantNodes = (brand === "All" && mode === "Standard")
        ? cy.nodes()
        : relevantEdges.connectedNodes();

    // 4. 【ここが今回の魔法ですわ！】
    // 指定されたブランドの子たちに、特別なクラスを授けます
    if (brand !== "All") {
        const brandNodes = cy.nodes(`[brand = "${brand}"]`);
        brandNodes.addClass('selected-brand-node');
        brandNodes.show();

        // そのブランドから出ている、あるいは受けている矢印も少し優先いたします
        relevantEdges.filter(e => e.source().data('brand') === brand || e.target().data('brand') === brand)
            .addClass('selected-brand-edge');
    }

    relevantNodes.show();
    relevantEdges.show();

    cy.elements(':visible').layout(getFCoSEOptions(true)).run();
};

window.rerunLayout = () => {
    if (!window.cyInstance) return;
    window.cyInstance.elements(':visible').layout(getFCoSEOptions(true)).run();
};

window.searchAndHighlight = (name) => {
    if (!window.cyInstance || !name || name.trim() === "") { clearHighlight(); return; }
    const cleanSearch = name.replace(/\s+/g, '');
    const target = window.cyInstance.nodes().filter(n => n.data('name').replace(/\s+/g, '').includes(cleanSearch)).first();
    if (target.length > 0) {
        highlightIdol(target);
        window.cyInstance.animate({ center: { eles: target }, zoom: 1.2 }, { duration: 500 });
    }
};

function highlightIdol(node) {
    const cy = window.cyInstance;
    const neighborhood = node.closedNeighborhood();
    cy.elements().removeClass('faded highlight focus');
    cy.elements().not(neighborhood).addClass('faded');
    node.addClass('highlight');
    neighborhood.edges().addClass('focus');
}

function clearHighlight() {
    if (window.cyInstance) window.cyInstance.elements().removeClass('faded highlight focus');
}