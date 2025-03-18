<script lang="ts">
    // Define basic sticker properties
    const { text, style = 'default' } = $props<{
        text: string;
        style?: 'default' | 'gradient1' | 'outline';
    }>();

    // Define types for the styles
    type TextStyle = {
        color: string;
        fontSize: string;
        fontWeight: string;
        textAlign: string;
        textShadowColor?: string;
        textShadowOffset?: { width: number; height: number };
        textShadowRadius?: number;
    };

    type ContainerStyle = {
        backgroundColor?: string;
        padding?: string;
        borderRadius?: string;
        borderWidth?: string;
        borderColor?: string;
        backgroundGradient?: {
            colors: string[];
            start?: { x: number; y: number };
            end?: { x: number; y: number };
        };
    };

    type StyleDefinition = {
        container: ContainerStyle;
        text: TextStyle;
    };

    // Predefined styles similar to the mobile app
    const styles: Record<string, StyleDefinition> = {
        default: {
            container: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '12px',
                borderRadius: '8px',
            },
            text: {
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                textAlign: 'center',
            }
        },
        gradient1: {
            container: {
                backgroundGradient: {
                    colors: ['#FF416C', '#FF4B2B'],
                    start: { x: 0, y: 0 },
                    end: { x: 1, y: 0 }
                },
                padding: '12px',
                borderRadius: '8px',
            },
            text: {
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                textAlign: 'center',
            }
        },
        outline: {
            container: {
                backgroundColor: 'transparent',
                padding: '12px',
                borderRadius: '8px',
                borderWidth: '2px',
                borderColor: 'white',
            },
            text: {
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                textAlign: 'center',
                textShadowColor: 'rgba(0, 0, 0, 0.75)',
                textShadowOffset: { width: 1, height: 1 },
                textShadowRadius: 3,
            }
        }
    };

    // Get the selected style or default
    const selectedStyle = $derived(styles[style] || styles.default);
    
    // Check if we should use a gradient background
    const hasGradient = $derived(selectedStyle.container.backgroundGradient && 
                     selectedStyle.container.backgroundGradient.colors &&
                     selectedStyle.container.backgroundGradient.colors.length > 1);
                     
    // Create CSS string for gradient if needed
    const gradientCSS = $derived(hasGradient && selectedStyle.container.backgroundGradient ? 
        `linear-gradient(to right, ${selectedStyle.container.backgroundGradient.colors.join(', ')})` : 
        'none');
        
    // Create container style
    const containerStyle = $derived(`
        background-color: ${hasGradient ? 'transparent' : selectedStyle.container.backgroundColor || 'transparent'};
        background-image: ${gradientCSS};
        padding: ${selectedStyle.container.padding || '0'};
        border-radius: ${selectedStyle.container.borderRadius || '0'};
        border-width: ${selectedStyle.container.borderWidth || '0'};
        border-style: ${selectedStyle.container.borderWidth ? 'solid' : 'none'};
        border-color: ${selectedStyle.container.borderColor || 'transparent'};
        width: 100%; 
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    `);
    
    // Create text style
    const textStyle = $derived(`
        color: ${selectedStyle.text.color || 'inherit'};
        font-size: ${selectedStyle.text.fontSize || 'inherit'};
        font-weight: ${selectedStyle.text.fontWeight || 'inherit'};
        text-align: ${selectedStyle.text.textAlign || 'inherit'};
        text-shadow: ${selectedStyle.text.textShadowOffset ? 
            `${selectedStyle.text.textShadowOffset.width}px ${selectedStyle.text.textShadowOffset.height}px ${selectedStyle.text.textShadowRadius || 0}px ${selectedStyle.text.textShadowColor || 'transparent'}` : 
            'none'};
        width: 100%;
        word-break: break-word;
        white-space: pre-wrap;
    `);
</script>

<div style={containerStyle}>
    <p style={textStyle}>{text}</p>
</div> 