class Calculator {
    constructor() {
        this.previousOperandElement = document.querySelector('.previous-operand');
        this.currentOperandElement = document.querySelector('.current-operand');
        this.calculator = document.querySelector('.calculator');
        this.buttons = document.querySelectorAll('button');
        
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.calculationComplete = false;
        
        this.initializeEvents();
        this.updateDisplay();
    }
    
    initializeEvents() {
        // Add 3D tilt effect on mouse move
        document.addEventListener('mousemove', (e) => {
            // Only apply if not on mobile
            if (window.innerWidth > 768) {
                const calculatorRect = this.calculator.getBoundingClientRect();
                const calculatorCenterX = calculatorRect.left + calculatorRect.width / 2;
                const calculatorCenterY = calculatorRect.top + calculatorRect.height / 2;
                
                const mouseX = e.clientX;
                const mouseY = e.clientY;
                
                const angleX = (mouseY - calculatorCenterY) / 30;
                const angleY = -(mouseX - calculatorCenterX) / 30;
                
                this.calculator.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg)`;
            }
        });
        
        // Reset transform when mouse leaves
        document.addEventListener('mouseleave', () => {
            this.calculator.style.transform = 'perspective(1000px) rotateX(10deg) rotateY(0deg)';
        });
        
        // Button click handlers
        this.buttons.forEach(button => {
            button.addEventListener('mousedown', () => {
                button.classList.add('button-pressed');
            });
            
            button.addEventListener('mouseup', () => {
                button.classList.remove('button-pressed');
            });
            
            button.addEventListener('mouseleave', () => {
                button.classList.remove('button-pressed');
            });
            
            button.addEventListener('click', () => {
                // Button press visual feedback
                this.addClickEffect(button);
                
                // Handle different button types
                if (button.hasAttribute('data-number')) {
                    this.appendNumber(button.getAttribute('data-number'));
                } else if (button.hasAttribute('data-operation')) {
                    this.chooseOperation(button.getAttribute('data-operation'));
                } else if (button.hasAttribute('data-action')) {
                    const action = button.getAttribute('data-action');
                    
                    if (action === 'clear') {
                        this.clear();
                    } else if (action === 'delete') {
                        this.delete();
                    } else if (action === 'calculate') {
                        this.calculate();
                    }
                }
                
                this.updateDisplay();
            });
        });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            // Prevent default action for calculator keys
            if (
                /[0-9\.\+\-\*\/\%\^]/.test(e.key) ||
                e.key === 'Enter' ||
                e.key === '=' ||
                e.key === 'Backspace' ||
                e.key === 'Delete' ||
                e.key === 'Escape'
            ) {
                e.preventDefault();
            }
            
            // Handle number keys
            if (/[0-9\.]/.test(e.key)) {
                this.appendNumber(e.key);
            }
            
            // Handle operation keys
            if (['+', '-', '%'].includes(e.key)) {
                this.chooseOperation(e.key);
            } else if (e.key === '*') {
                this.chooseOperation('×');
            } else if (e.key === '/') {
                this.chooseOperation('÷');
            } else if (e.key === '^') {
                this.chooseOperation('^');
            }
            
            // Handle action keys
            if (e.key === 'Enter' || e.key === '=') {
                this.calculate();
            } else if (e.key === 'Backspace') {
                this.delete();
            } else if (e.key === 'Delete' || e.key === 'Escape') {
                this.clear();
            }
            
            this.updateDisplay();
        });
    }
    
    addClickEffect(button) {
        // Add ripple effect
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        button.appendChild(ripple);
        
        // Remove ripple after animation completes
        setTimeout(() => {
            ripple.remove();
        }, 600);
        
        // Play click sound if available
        // const clickSound = document.getElementById('clickSound');
        // if (clickSound) clickSound.play().catch(err => console.error('Sound play failed', err));
    }
    
    appendNumber(number) {
        // If calculation is complete, start fresh
        if (this.calculationComplete) {
            this.currentOperand = '0';
            this.calculationComplete = false;
        }
        
        // Handle decimal point
        if (number === '.' && this.currentOperand.includes('.')) {
            // Show error animation for trying to add multiple decimal points
            this.showError();
            return;
        }
        
        // Handle leading zero cases
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number;
        } else {
            this.currentOperand = this.currentOperand.toString() + number.toString();
        }
        
        // Handle maximum digits
        if (this.currentOperand.replace(/[^0-9]/g, '').length > 12) {
            this.showError();
            this.currentOperand = this.currentOperand.slice(0, -1);
        }
    }
    
    chooseOperation(operation) {
        // Reset error status
        this.calculationComplete = false;
        
        // Handle empty input
        if (this.currentOperand === '') return;
        
        // Perform calculation if there's already a pending operation
        if (this.previousOperand !== '') {
            this.calculate();
        }
        
        // Set up next operation
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '0';
    }
    
    calculate() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        
        // Skip if any input is NaN
        if (isNaN(prev) || isNaN(current)) return;
        
        // Perform calculation based on selected operation
        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '×':
                computation = prev * current;
                break;
            case '÷':
                if (current === 0) {
                    // Division by zero error - updated message
                    this.showError();
                    this.clear();
                    this.currentOperand = 'Cannot divide by zero';
                    this.calculationComplete = true;
                    return;
                }
                computation = prev / current;
                break;
            case '%':
                computation = prev % current;
                break;
            case '^':
                computation = Math.pow(prev, current);
                break;
            default:
                return;
        }
        
        // Format result to avoid excessively long numbers
        if (computation.toString().includes('.')) {
            const decimalPlaces = Math.min(10, 
                // Limit total length to 12, distribute remaining space to decimal places
                Math.max(0, 12 - Math.floor(computation).toString().length));
            this.currentOperand = computation.toFixed(decimalPlaces);
            // Remove trailing zeros
            this.currentOperand = this.currentOperand.replace(/\.?0+$/, '');
        } else {
            this.currentOperand = computation.toString();
        }
        
        // Reset operation state
        this.operation = undefined;
        this.previousOperand = '';
        this.calculationComplete = true;
    }
    
    delete() {
        // Reset if calculation is complete
        if (this.calculationComplete) {
            this.clear();
            return;
        }
        
        // Handle deletion
        if (this.currentOperand.length > 1) {
            this.currentOperand = this.currentOperand.slice(0, -1);
        } else {
            this.currentOperand = '0';
        }
    }
    
    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.calculationComplete = false;
    }
    
    showError() {
        this.currentOperandElement.classList.add('error');
        setTimeout(() => {
            this.currentOperandElement.classList.remove('error');
        }, 500);
    }
    
    getDisplayNumber(number) {
        // If the number is the error message, just return it
        if (number === 'Cannot divide by zero') {
            return number;
        }
        
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        
        let integerDisplay;
        
        if (isNaN(integerDigits)) {
            integerDisplay = '0';
        } else {
            integerDisplay = integerDigits.toLocaleString('en', {
                maximumFractionDigits: 0
            });
        }
        
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }
    
    updateDisplay() {
        this.currentOperandElement.textContent = this.getDisplayNumber(this.currentOperand);
        
        if (this.operation != null) {
            this.previousOperandElement.textContent = 
                `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandElement.textContent = '';
        }
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});
