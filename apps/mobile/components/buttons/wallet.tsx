import Lightning from "../icons/lightning";

export default function WalletButton({ focused, color }: { focused: boolean, color: string }) {
    return (
            <Lightning 
                width={24} 
                height={24} 
                strokeWidth={focused ? 2.5 : 2} 
                fill={color}
                stroke={color}
                style={{ transition: 'all 0.3s ease-in-out' }}
            />
    )
}
