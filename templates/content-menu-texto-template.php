<?php $select = apply_filters('texto_em_debate_menu_items', get_the_content()); ?>
<div class="menu-topo-mc">
    <div class="menu-top-content">
        <div class="row">
            <div class="container">
                <div class="col-md-6 mt-sm">
                    <?= $select ?>
                </div>
                <div class="col-md-3 mt-sm">
                    <div class="input-group">
                        <input id="txt-texto-em-debate" type="text" class="form-control" placeholder="Busque na página">
                <span class="clear-input-btn hidden">
                    <i class="fa fa-times"></i>
                </span>
                <span class="input-group-btn">
                    <button id="btn-search-texto-em-debate" class="btn btn-default" type="button">
                        <i class="fa fa-search"></i>
                    </button>
                </span>
                    </div>
                </div>
                <div class="col-md-3 mt-sm">
                    <div class="btn-group" role="group" aria-label="...">
                        <button id="prev-highlight" type="button" class="btn btn-default">
                            <i class="fa fa-chevron-left"></i>
                        </button>
                        <button type="button" class="btn btn-default" disabled="disabled" data-toggle="tooltip"
                                data-placement="bottom" title="Resultado da busca">
                            <span class="current-highlight">0</span> de <span class="total-highlight">0</span>
                        </button>
                        <button id="next-highlight" type="button" class="btn btn-default">
                            <i class="fa fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <a href="javascript:void(0)" class="expander-menu-top btn btn-danger btn-sm"><i class="fa fa-sort"></i> Mostrar/Esconder menu</a>
</div>
