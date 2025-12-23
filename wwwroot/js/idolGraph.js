/**
 * ブランドカラー定義
 * お嬢様が調整された名称に準拠しておりますわ
 */
const BRAND_COLORS = {
    '765PRO AS': '#f34f6d',
    'Cinderella Girls': '#2681c8',
    'Million Live': '#ffc30b',
    'SideM': '#0dba3b',
    'Shiny Colors': '#79c5f0',
    'Gakuen': '#ff8c00',
    'Other': '#ccc'
};

/**
 * 物理演算（fCoSE）の設定
 * ウィンドウを贅沢に使い、重力から解放された広大な配置ですわ
 */
const getFCoSEOptions = (isFilter = false) => ({
    name: 'fcose',
    quality: 'proof',
    randomize: !isFilter,
    animate: true,
    animationDuration: 1500,
    fit: true,
    padding: 70,
    nodeRepulsion: 150000,
    idealEdgeLength: (edge) => edge.hasClass('mutual') ? 120 : 450,
    gravity: 0.05,
    numIter: 5000,
    uniformNodeDimensions: false,
    packComponents: true,
    tile: true,
    tilingPaddingVertical: 120,
    tilingPaddingHorizontal: 120
});

/**
 * 劇場の開演（初期化）
 */
window.initIdolGraph = (data) => {
    if (window.cyInstance) { window.cyInstance.destroy(); }

    const cyContainer = document.getElementById('cy');
    // 演出：右クリックメニューを封印し、独自の操作を許可いたします
    cyContainer.oncontextmenu = () => false;

    window.cyInstance = cytoscape({
        container: cyContainer,
        elements: data,

        // --- 操作感の調律 ---
        wheelSensitivity: 0.4,      // ズーム速度を向上させましたわ
        boxSelectionEnabled: false, // 右ドラッグを移動に使うため解除いたします
        userPanningEnabled: true,   // 平行移動を許可いたします

        style: [
            // --- アイドル（ノード）の正装 ---
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
                    'transition-property': 'width, height, border-width, opacity',
                    'transition-duration': '0.3s'
                }
            },
            {
                selector: 'node.highlight',
                style: {
                    'width': (node) => node.data('baseSize') * 1.15,
                    'height': (node) => node.data('baseSize') * 1.15,
                    'border-width': 12,
                    'z-index': 999
                }
            },
            // --- 絆（エッジ）の正装 ---
            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'arrow-scale': 1.8,      // 巨大な三角形の誇りですわ
                    'line-color': '#666',
                    'target-arrow-shape': 'triangle',
                    'target-arrow-color': '#666',
                    'curve-style': 'bezier',
                    'opacity': 0.8,
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
                    'source-arrow-shape': 'triangle', // 両端の三角形ですわ
                    'source-arrow-color': '#FF69B4',
                    'opacity': 0.9
                }
            },
            {
                selector: 'edge.focus',
                style: { 'opacity': 1, 'width': 5 }
            },
            {
                selector: 'edge.focus.mutual',
                style: { 'width': 12 }
            },
            { selector: '.faded', style: { 'opacity': 0.05, 'events': 'no' } }
        ],
        ready: function () {
            const cy = this;
            const nodes = cy.nodes();

            // 面積比例の黄金比計算（最大は最小の3倍に収めますわ）
            const minSize = 80;
            const maxSize = minSize * 3;
            const maxInDegree = Math.max(...nodes.map(n => n.indegree()), 1);
            const scaleFactor = (maxSize - minSize) / Math.sqrt(maxInDegree);

            nodes.forEach(node => {
                const bSize = minSize + (Math.sqrt(node.indegree()) * scaleFactor);
                node.data('baseSize', bSize);
                node.style({ 'width': bSize, 'height': bSize });
            });

            cy.layout(getFCoSEOptions(false)).run();

            // --- 右クリックドラッグによる平行移動の魔法 ---
            cy.on('cxtdrag', (e) => {
                cy.panBy({ x: e.originalEvent.movementX, y: e.originalEvent.movementY });
            });

            // マウス操作
            cy.on('mouseover', 'node', (e) => highlightIdol(e.target));
            cy.on('mouseout', 'node', () => clearHighlight());
        }
    });

    // 背景タップで全体を収めますわ
    window.cyInstance.on('tap', function (event) {
        if (event.target === window.cyInstance) {
            window.cyInstance.animate({ fit: { padding: 70 }, duration: 800 });
        }
    });

    window.cyInstance.on('tap', 'node', (evt) => {
        window.open('https://idollist.idolmaster-official.jp/search/detail/' + evt.target.id(), '_blank');
    });

    // リサイズ追従
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.cyInstance) {
                window.cyInstance.resize();
                window.cyInstance.fit(null, 70);
            }
        }, 200);
    });
};

/**
 * 演出補助：ハイライトと解除
 */
function highlightIdol(node) {
    if (!window.cyInstance) return;
    const cy = window.cyInstance;
    const neighborhood = node.closedNeighborhood();
    cy.elements().removeClass('faded highlight focus');
    cy.elements().not(neighborhood).addClass('faded');
    node.addClass('highlight');
    neighborhood.edges().addClass('focus');
}

function clearHighlight() {
    if (!window.cyInstance) return;
    window.cyInstance.elements().removeClass('faded highlight focus');
}

/**
 * 演出補助：指名手配（検索）
 */
window.searchAndHighlight = (name) => {
    if (!window.cyInstance) return;
    const cy = window.cyInstance;
    if (!name || name.trim() === "") {
        clearHighlight();
        return;
    }
    const target = cy.nodes().filter(n => n.data('name').includes(name)).first();
    if (target.length > 0) {
        highlightIdol(target);
        cy.animate({ center: { eles: target }, zoom: 1.2 }, { duration: 500 });
    }
};

/**
 * 演出補助：選考（フィルター）
 */
window.applyBrandFilter = (brand) => {
    if (!window.cyInstance) return;
    const cy = window.cyInstance;
    cy.elements().show();

    if (brand === "All") {
        // 何もしませんわ
    } else if (brand === "MutualOnly") {
        cy.elements().hide();
        const mutualEdges = cy.edges('.mutual');
        mutualEdges.show();
        mutualEdges.connectedNodes().show();
    } else {
        cy.elements().hide();
        const nodes = cy.nodes(`[brand = "${brand}"]`);
        nodes.show();
        nodes.connectedEdges().show();
    }
    cy.elements(':visible').layout(getFCoSEOptions(true)).run();
};