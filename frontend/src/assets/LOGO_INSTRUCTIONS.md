# Logo Instructions

## Adding Your Logo Image

To replace the current "F" letter logo with your actual logo image:

1. **Save your logo image** to this folder (`frontend/src/assets/`) with the name `logo.png`

2. **Update the Logo component** at `frontend/src/components/Logo.jsx`:

Replace the current Logo component with:

```jsx
import React from 'react'
import logoImage from '../assets/logo.png'

const Logo = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { width: '24px', height: '24px' },
    md: { width: '32px', height: '32px' },
    lg: { width: '48px', height: '48px' },
    xl: { width: '64px', height: '64px' }
  }

  const sizeStyle = sizes[size] || sizes.md

  return (
    <img 
      src={logoImage}
      alt="FlowFinance Logo"
      className={className}
      style={{
        width: sizeStyle.width,
        height: sizeStyle.height,
        borderRadius: '12px',
        objectFit: 'cover'
      }}
    />
  )
}

export default Logo
```

## Current Logo Usage

The Logo component is currently used in:
- Home page (navigation and footer)
- Features page (navigation and footer)
- Pricing page (navigation and footer)
- About page (navigation and footer)
- Contact page (navigation and footer)
- Login page (main logo)
- Register page (main logo)
- Layout component (dashboard navigation)
- LoadingScreen component (loading animation)

All logos will automatically update once you replace the Logo component!
