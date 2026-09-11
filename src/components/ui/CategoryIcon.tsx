import {
  Utensils,
  ShoppingCart,
  Bus,
  PartyPopper,
  Shirt,
  Laptop,
  CreditCard,
  HeartPulse,
  GraduationCap,
  Sparkles,
  LucideProps,
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name: string;
}

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  switch (name) {
    case 'Utensils':
      return <Utensils {...props} />;
    case 'ShoppingCart':
      return <ShoppingCart {...props} />;
    case 'Bus':
      return <Bus {...props} />;
    case 'PartyPopper':
      return <PartyPopper {...props} />;
    case 'Shirt':
      return <Shirt {...props} />;
    case 'Laptop':
      return <Laptop {...props} />;
    case 'CreditCard':
      return <CreditCard {...props} />;
    case 'HeartPulse':
      return <HeartPulse {...props} />;
    case 'GraduationCap':
      return <GraduationCap {...props} />;
    case 'Sparkles':
    default:
      return <Sparkles {...props} />;
  }
}

