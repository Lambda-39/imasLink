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

// 劇場の「現在の選考（フィルター）」を記憶する日記帳ですわ
let currentFilter = "All";

/**
 * 物理演算（fCoSE）の設定
 * 島同士の「独立性」を極限まで高めた、広大な舞台設計ですわ
 */

const getFCoSEOptions = (random = false) => {
    // 現在の舞台が「全員表示」かどうかを判断いたします
    const isAllMode = (currentFilter === "All");

    return {
        name: 'fcose',
        quality: 'default',
        randomize: random,
        animate: true,
        animationDuration: 1500,
        fit: true,
        padding: 100,

        // 1. 全員表示時は、ノード同士が反発し合う力を極限まで高め、重なりを根絶いたします
        nodeRepulsion: isAllMode ? 0 : 450000,

        // 2. 中心へ引き寄せる力を弱め、舞台を広く、大きく使いますわ
        gravity: isAllMode ? 0.001 : 0.01,

        // 3. 島同士の隙間も広げ、ブランドごとの独立性を守ります
        tile: true,
        tilingPaddingVertical: isAllMode ? 1000 : 300,
        tilingPaddingHorizontal: isAllMode ? 1000 : 300,

        /**
         * 絆の長さ（引力）の調律
         * 全員表示時：人気者は「空間」を、レアな絆は「親密さ」を！
         */
        idealEdgeLength: (edge) => {
            // 1. 両想いは「特別な絆」ですので、常に密接（80 * 2 = 160px）にいたしますわ
            if (edge.hasClass('mutual')) {
                return isAllMode ? 160 : 80;
            }

            let baseLength = 400; // 片思いの基本距離

            if (isAllMode) {
                baseLength *= 2; // 全員表示時は 800px からスタートいたします

                // 2. 【ここが修正ポイントですわ！】
                // indegree() ではなく degree() を使うことで、
                // 統合されたエッジの「見えない向き」も考慮した人気度を測りますの。
                const targetPopularity = edge.target().degree() - 4;

                // 3. 注目されている子（degreeが高い）ほど距離を離し、空間を確保いたします。
                // 逆に degree が低い子への矢印は短く保たれ、強く引き寄せられますわ。
                baseLength += (targetPopularity * 20);
            }

            return baseLength;
        },

        // 全員表示時は計算量を増やし、最適解へ辿り着くまでの時間を確保いたします
        numIter: isAllMode ? 15000 : 5000,
        packComponents: true,
    };
};

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
            // --- 絆（エッジ）の正装を、ブランドの色に染め上げますわ ---
            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'arrow-scale': 1.8,
                    // 演出：線の色を、送り主（source）のブランドカラーに合わせますわ
                    'line-color': (edge) => {
                        const sourceBrand = edge.source().data('brand');
                        return BRAND_COLORS[sourceBrand] || BRAND_COLORS['Other'];
                    },
                    'target-arrow-shape': 'triangle',
                    // 演出：矢印の先端（ターゲット側）の色も揃えるのが淑女の嗜みですわ
                    'target-arrow-color': (edge) => {
                        const sourceBrand = edge.source().data('brand');
                        return BRAND_COLORS[sourceBrand] || BRAND_COLORS['Other'];
                    },
                    'curve-style': 'bezier',
                    'opacity': 0.6, // 色を際立たせるため、少し濃いめに調整いたしました
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

            cy.layout(getFCoSEOptions(true)).run();

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
 * 姓名の間のスペースも、入力ミスによる空白も、わたくしの目は誤魔化せませんわ
 */
window.searchAndHighlight = (name) => {
    if (!window.cyInstance) return;
    const cy = window.cyInstance;

    // 1. まず、お嬢様が入力された検索語から空白を除去いたします
    if (!name || name.trim() === "") {
        clearHighlight();
        return;
    }
    const cleanSearchName = name.replace(/\s+/g, '');

    // 2. ノード側の名前も空白を除去して比較いたしますわ
    const target = cy.nodes().filter(n => {
        const idolName = n.data('name') || "";
        const cleanIdolName = idolName.replace(/\s+/g, '');

        // 空白を除去した同士で、含まれているかチェックいたしますの
        return cleanIdolName.includes(cleanSearchName);
    }).first();

    if (target.length > 0) {
        highlightIdol(target);
        cy.animate({ center: { eles: target }, zoom: 1.2 }, { duration: 500 });
    }
};

/**
 * 演出補助：選考（フィルター）
 */
window.applyBrandFilter = (brand) => {
    currentFilter = brand; // ここで選考内容を記憶いたします
    const cy = window.cyInstance;
    if (!cy) return;

    cy.elements().show();
    if (brand === "MutualOnly") {
        cy.elements().hide();
        const mutualEdges = cy.edges('.mutual');
        mutualEdges.show();
        mutualEdges.connectedNodes().show();
    } else if (brand !== "All") {
        cy.elements().hide();
        const nodes = cy.nodes(`[brand = "${brand}"]`);
        nodes.show();
        nodes.connectedEdges().show();
    }

    // フィルター時は位置を変えない（randomize: false）ようにいたしますわ
    cy.elements(':visible').layout(getFCoSEOptions(true)).run();
};

/**
* 演出補助：再ランダム配置
*/
window.rerunLayout = () => {
    const cy = window.cyInstance;
    if (!cy) return;


    // 【ここが重要ですわ！】
    // 全員ではなく、現在見えている（フィルターを通り抜けた）アイドルたちだけを
    // 新たな運命（randomize: true）に導きますわ
    cy.elements(':visible').layout(getFCoSEOptions(true)).run();
};




/**
* 演出補助：ブランドAへの注目度フィルター
* 外のブランドからブランドAへ、あるいは両想いの絆を漏れなく抽出いたします
*/
window.applyIncomingInterBrandFilter = (brandA) => {
    if (!window.cyInstance) return;
    const cy = window.cyInstance;
    currentFilter = brandA;

    // 1. 舞台の浄化（すべてを非表示に）
    cy.elements().hide();

    // 2. 絆（エッジ）の厳選
    const relevantEdges = cy.edges().filter(edge => {
        const source = edge.source();
        const target = edge.target();
        const sBrand = source.data('brand');
        const tBrand = target.data('brand');

        // 【ここがお嬢様の仰るポイントですわ！】
        // 送り主と受け取り手のブランドが異なっているものだけを対象にいたします
        if (sBrand === tBrand) return false;

        // 次に、その絆が「ブランドA」に関わっているかチェックいたします
        const involvesBrandA = (sBrand === brandA || tBrand === brandA);
        if (!involvesBrandA) return false;

        // 矢印を採用する条件ですわ
        if (edge.hasClass('mutual')) {
            return true; // 両想いは、データの向きを問わず表示いたします
        } else {
            // 片想いなら、到達点（target）がブランドAであるものだけ
            // ※ここでも「変数」ではなく「到達点のデータ」を尊重するなら tBrand === brandA ですわ
            return tBrand === brandA;
        }
    });

    // 3. 関連するアイドルたちの特定
    const targetNodes = cy.nodes(`[brand = "${brandA}"]`);
    const sourceNodes = relevantEdges.connectedNodes().filter(n => n.data('brand') !== brandA);

    // 4. 点灯（表示）
    targetNodes.show();
    sourceNodes.show();
    relevantEdges.show();

    // 5. 優雅な配置
    cy.elements(':visible').layout(getFCoSEOptions(true)).run();
};