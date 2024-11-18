import * as CheckboxPrimitive from '@rn-primitives/checkbox';
import { useControllableState } from '@rn-primitives/hooks';
import { Icon } from '@roninoss/icons';
import * as React from 'react';
import { Platform } from 'react-native';

import { cn } from '~/lib/cn';
import { COLORS } from '~/theme/colors';

type CheckboxProps = Omit<
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    'checked' | 'onCheckedChange'
> & {
    defaultChecked?: boolean;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
};

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
    (
        { className, checked: checkedProps, onCheckedChange: onCheckedChangeProps, defaultChecked = false, ...props },
        ref
    ) => {
        const [checked = false, onCheckedChange] = useControllableState({
            prop: checkedProps,
            defaultProp: defaultChecked,
            onChange: onCheckedChangeProps,
        });
        return (
            <CheckboxPrimitive.Root
                ref={ref}
                className={cn(
                    'ios:rounded-full ios:h-[22px] ios:w-[22px] h-[18px] w-[18px] rounded-sm border border-muted-foreground',
                    checked && 'border-0 bg-primary',
                    props.disabled && 'opacity-50',
                    className
                )}
                checked={checked}
                onCheckedChange={onCheckedChange}
                {...props}>
                <CheckboxPrimitive.Indicator className={cn('h-full w-full items-center justify-center')}>
                    <Icon
                        name="check"
                        ios={{ weight: 'medium' }}
                        size={Platform.select({ ios: 15, default: 16 })}
                        color={COLORS.white}
                    />
                </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Root>
        );
    }
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
