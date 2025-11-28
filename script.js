class Cell {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.plant = null;
    }
    
    getColor() {
        return this.type === 'water' ? '#4fc3f7' : '#a1887f';
    }
}

class Plant {
    constructor(name, requiredWaterDistance, emoji) {
        this.name = name;
        this.requiredWaterDistance = requiredWaterDistance;
        this.growthStage = 0;
        this.isAlive = true;
        this.emoji = emoji;
    }
    
    updateGrowth(hasWaterInRange) {
        if (!this.isAlive) return;
        
        if (hasWaterInRange) {
            this.growthStage = Math.min(1, this.growthStage + 0.05);
        } else {
            this.isAlive = false;
        }
    }
    
    getSizeClass() {
        if (this.growthStage < 0.33) return 'small';
        if (this.growthStage < 0.66) return 'medium';
        return 'large';
    }
}

class FarmSimulator {
    constructor(gridSize = 8) {
        this.gridSize = gridSize;
        this.cells = [];
        this.selectedTool = 'cursor';
        this.waterCells = [];
        this.initGrid();
        this.setupEventListeners();
        this.startGrowthCycle();
    }
    
    initGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        this.cells = [];
        this.waterCells = [];
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cellType = Math.random() < 0.85 ? 'land' : 'water';
                const cell = new Cell(cellType, x, y);
                
                this.cells.push(cell);
                
                if (cellType === 'water') {
                    this.waterCells.push(cell);
                }
                
                const cellElement = document.createElement('div');
                cellElement.className = `cell ${cellType}`;
                cellElement.dataset.x = x;
                cellElement.dataset.y = y;
                cellElement.style.backgroundColor = cell.getColor();
                
                cellElement.addEventListener('click', () => this.handleCellClick(cell, cellElement));
                
                gridElement.appendChild(cellElement);
            }
        }
    }
    
    setupEventListeners() {
        const tools = [
            'cursor',
            'shovel',
            'marsh-seeds',
            'potato-seeds', 
            'cactus-seeds',
            'bucket'
        ];
        
        tools.forEach(tool => {
            document.getElementById(tool).addEventListener('click', () => {
                this.selectTool(tool);
            });
        });
    }
    
    selectTool(tool) {
        this.selectedTool = tool;
        
        document.querySelectorAll('.tool').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(tool).classList.add('active');
    }
    
    handleCellClick(cell, cellElement) {
        switch (this.selectedTool) {
            case 'cursor':
                this.updateCellInfo(cell);
                break;
            case 'shovel':
                this.useShovel(cell, cellElement);
                break;
            case 'marsh-seeds':
                this.plantSeed(cell, cellElement, new Plant('Болотник', 1, '🌿'));
                break;
            case 'potato-seeds':
                this.plantSeed(cell, cellElement, new Plant('Картошка', [2, 3], '🥔'));
                break;
            case 'cactus-seeds':
                this.plantSeed(cell, cellElement, new Plant('Кактус', [4, 100], '🌵'));
                break;
            case 'bucket':
                this.useBucket(cell, cellElement);
                break;
        }
        
        this.updateCellInfo(cell);
    }
    
    useShovel(cell, cellElement) {
        if (cell.type === 'water' || !cell.plant) {
            return;
        }
        
        cell.plant = null;
        this.removePlantFromCell(cellElement);
    }
    
    plantSeed(cell, cellElement, plant) {
        if (cell.type !== 'land' || cell.plant) {
            return;
        }
        
        // Проверяем, можно ли посадить растение здесь
        const canPlant = this.canPlantHere(cell, plant);
        
        if (canPlant) {
            cell.plant = plant;
            this.addPlantToCell(cellElement, plant);
        } else {
            alert(`Нельзя посадить ${plant.name} здесь! Требуется вода на расстоянии ${plant.requiredWaterDistance} клеток.`);
        }
    }
    
    canPlantHere(cell, plant) {
        // Если нет воды на поле, только кактусы можно сажать
        if (this.waterCells.length === 0) {
            return plant.name === 'Кактус';
        }
        
        // Проверяем расстояние до ближайшей воды
        let minDistance = Infinity;
        
        for (const waterCell of this.waterCells) {
            const distance = Math.abs(cell.x - waterCell.x) + Math.abs(cell.y - waterCell.y);
            minDistance = Math.min(minDistance, distance);
        }
        
        // Проверяем, подходит ли расстояние для растения
        if (Array.isArray(plant.requiredWaterDistance)) {
            return minDistance >= plant.requiredWaterDistance[0] && 
                   minDistance <= plant.requiredWaterDistance[1];
        } else {
            return minDistance === plant.requiredWaterDistance;
        }
    }
    
    useBucket(cell, cellElement) {
        if (cell.type === 'land') {
            cell.type = 'water';
            this.waterCells.push(cell);
            cellElement.className = 'cell water';
            cellElement.style.backgroundColor = cell.getColor();
            
            // Убираем растение, если оно есть
            if (cell.plant) {
                cell.plant = null;
                this.removePlantFromCell(cellElement);
            }
        } else {
            cell.type = 'land';
            
            // Удаляем клетку из массива водных клеток
            const index = this.waterCells.findIndex(wc => wc.x === cell.x && wc.y === cell.y);
            if (index !== -1) {
                this.waterCells.splice(index, 1);
            }
            
            cellElement.className = 'cell land';
            cellElement.style.backgroundColor = cell.getColor();
        }
        
        // Обновляем состояние всех растений после изменения воды
        this.updateAllPlants();
    }
    
    addPlantToCell(cellElement, plant) {
        const plantElement = document.createElement('div');
        plantElement.className = `plant ${plant.getSizeClass()}`;
        plantElement.textContent = plant.emoji;
        plantElement.title = `${plant.name} (рост: ${Math.round(plant.growthStage * 100)}%)`;
        cellElement.appendChild(plantElement);
    }
    
    removePlantFromCell(cellElement) {
        const plantElement = cellElement.querySelector('.plant');
        if (plantElement) {
            cellElement.removeChild(plantElement);
        }
    }
    
    getCellElement(x, y) {
        return document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    }
    
    updateCellInfo(cell) {
        const infoElement = document.getElementById('cell-info');
        let info = `Тип: ${cell.type === 'land' ? 'Земля' : 'Вода'}<br>`;
        info += `Координаты: (${cell.x}, ${cell.y})<br>`;
        
        if (cell.plant) {
            info += `Растение: ${cell.plant.name}<br>`;
            info += `Стадия роста: ${Math.round(cell.plant.growthStage * 100)}%<br>`;
            info += `Состояние: ${cell.plant.isAlive ? 'Живое' : 'Погибшее'}`;
        } else {
            info += 'Растение: отсутствует';
        }
        
        infoElement.innerHTML = info;
    }
    
    updateAllPlants() {
        for (const cell of this.cells) {
            if (cell.plant) {
                const hasWaterInRange = this.canPlantHere(cell, cell.plant);
                cell.plant.updateGrowth(hasWaterInRange);
                
                const cellElement = this.getCellElement(cell.x, cell.y);
                if (cellElement) {
                    const plantElement = cellElement.querySelector('.plant');
                    if (plantElement) {
                        plantElement.className = `plant ${cell.plant.getSizeClass()} ${cell.plant.isAlive ? '' : 'dead'}`;
                        plantElement.title = `${cell.plant.name} (рост: ${Math.round(cell.plant.growthStage * 100)}%)`;
                        
                        if (!cell.plant.isAlive) {
                            // Можно автоматически удалить мертвое растение через некоторое время
                            setTimeout(() => {
                                if (cell.plant && !cell.plant.isAlive) {
                                    cell.plant = null;
                                    this.removePlantFromCell(cellElement);
                                    this.updateCellInfo(cell);
                                }
                            }, 3000);
                        }
                    }
                }
            }
        }
    }
    
    startGrowthCycle() {
        setInterval(() => {
            this.updateAllPlants();
        }, 1000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FarmSimulator();
});