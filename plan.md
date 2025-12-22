I want to make a slicing pie software for internal use.

Slicing Pie is a universal, one-size-fits all model that creates a perfectly fair equity split in an early-stage, bootstrapped startup company.

Two user roles: Admin and Viewer.

The admin can create users.

A user should define a base market rate monthly salary. the software should calculate the hourly rate and also store it.

I should be able to add two types of contributions:
- time
- money

stick with the standard approach, calculations, and multipliers of the original book:

Slicing Pie Handbook: Perfectly Fair Equity Splits for Bootstrapped Startups
by Mike Moyer




this is the theming I want. which is solid, trusty, clear, hard.

```
@layer base {
  :root {
    /* Base colors - Light mode with high contrast */
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    /* Darker near-black green palette */
    --primary: 142 40% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 142 35% 8%;
    --accent-foreground: 0 0% 98%;
    /* Added success to align with darker green palette */
    --success: 142 40% 10%;
    --success-foreground: 0 0% 98%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    /* Ring matches new primary */
    --ring: 142 40% 10%;

    /* Enhanced gradients updated for darker green */
    --gradient-primary: linear-gradient(135deg, hsl(142 38% 12%), hsl(142 30% 6%));
    --gradient-dark: linear-gradient(135deg, hsl(0, 0%, 96%), hsl(0, 0%, 100%));
    --gradient-subtle: linear-gradient(180deg, hsl(0, 0%, 100%), hsl(0, 0%, 96%));
    --gradient-success: linear-gradient(135deg, hsl(142 40% 10%), hsl(142 28% 5%));
    --gradient-card: linear-gradient(145deg, hsl(0, 0%, 100%), hsl(0, 0%, 98%));
    
    /* Advanced shadows */
    --shadow-elegant: 0 10px 30px -10px hsl(0, 0%, 0%, 0.1);
    --shadow-glow: 0 0 40px hsla(141, 76%, 21%, 0.1);
    --shadow-card: 0 4px 20px -4px hsl(0, 0%, 0%, 0.05);
    --shadow-inset: inset 0 1px 0 hsl(0, 0%, 100%, 1);
    
    /* Transitions */
    --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-fast: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    
    /* Border radius - Zero radius for boxy design */
    --radius: 0px;
    --radius-lg: 0px;
    --radius-xl: 0px;

    /* Sidebar */
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 0 0% 15%;
    --sidebar-primary: 142 40% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 0 0% 96.1%;
    --sidebar-accent-foreground: 0 0% 9%;
    --sidebar-border: 0 0% 89.8%;
    --sidebar-ring: 142 40% 10%;
  }

  .dark {
    /* Keep light mode consistent */
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 142 40% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 142 35% 8%;
    --accent-foreground: 0 0% 98%;
    --success: 142 40% 10%;
    --success-foreground: 0 0% 98%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 142 40% 10%;
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 0 0% 15%;
    --sidebar-primary: 142 40% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 0 0% 96.1%;
    --sidebar-accent-foreground: 0 0% 9%;
    --sidebar-border: 0 0% 89.8%;
    --sidebar-ring: 142 40% 10%;
  }
}
```