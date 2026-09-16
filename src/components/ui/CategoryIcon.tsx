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
  Scissors,
  Dumbbell,
  Home,
  PawPrint,
  Car,
  Gift,
  Coffee,
  Smile,
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
    case 'Scissors':
      return <Scissors {...props} />;
    case 'Dumbbell':
      return <Dumbbell {...props} />;
    case 'Home':
      return <Home {...props} />;
    case 'PawPrint':
      return <PawPrint {...props} />;
    case 'Car':
      return <Car {...props} />;
    case 'Gift':
      return <Gift {...props} />;
    case 'Coffee':
      return <Coffee {...props} />;
    case 'Smile':
      return <Smile {...props} />;
    case 'GraduationCap':
      return <GraduationCap {...props} />;
    case 'Sparkles':
    default:
      return <Sparkles {...props} />;
  }
}
