import React, { useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { HelpCircle } from 'lucide-react';

function Icon({
    name,
    size = 24,
    color = "currentColor",
    className = "",
    strokeWidth = 2,
    ...props
}) {
    const IconComponent = LucideIcons?.[name];

    if (!IconComponent) {
        return <HelpCircle size={size} color="gray" strokeWidth={strokeWidth} className={className} {...props} />;
    }

    return <IconComponent
        size={size}
        color={color}
        strokeWidth={strokeWidth}
        className={className}
        {...props}
    />;
}
export default Icon;
const AppIcon = () => {
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.warn('Placeholder: AppIcon is not implemented yet.');
  }, []);
  return (
    <div>
      {/* AppIcon placeholder */}
    </div>
  );
};

export { AppIcon };