import Lightning from "../icons/lightning";

export default function WalletButton({ size = 28, focused, color }: { size?: number, focused: boolean, color: string }) {
    return (
            <Lightning 
                width={size} 
                height={size} 
                strokeWidth={focused ? 2.5 : 2} 
                stroke={color}
                style={{ transition: 'all 0.3s ease-in-out' }}
            />
    )
}
