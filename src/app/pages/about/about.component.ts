import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {
  chefs = [
    {
      name: "Marcus Vance",
      role: "Executive Chef",
      bio: "With over 18 years of culinary leadership at Michelin-starred venues, Marcus crafts the vision behind FoodieHub's signature dishes.",
      image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=400",
      socials: { facebook: "#", twitter: "#", instagram: "#" }
    },
    {
      name: "Elena Rostova",
      role: "Head Chef de Cuisine",
      bio: "Hailing from Rome, Elena specializes in hand-stretched pastas and utilizing ancestral cooking styles with a modern fusion twist.",
      image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=400",
      socials: { facebook: "#", twitter: "#", instagram: "#" }
    },
    {
      name: "Jean-Luc Dupont",
      role: "Pastry Master",
      bio: "Jean-Luc brings Parisian precision to the sweet department, specializing in sugar sculptures and decadent dessert compositions.",
      image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=400",
      socials: { facebook: "#", twitter: "#", instagram: "#" }
    }
  ];

  stats = [
    { value: "15+", label: "Years of Culinary Passion" },
    { value: "12+", label: "Award Winning Chefs" },
    { value: "50k+", label: "Delighted Guests" },
    { value: "25+", label: "Michelin & Local Stars" }
  ];

  gallery = [
    {
      title: "Luxurious Dining Room",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600",
      category: "Interior"
    },
    {
      title: "The Fire Pit Kitchen",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=600",
      category: "Kitchen"
    },
    {
      title: "Toast to Memories",
      image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&q=80&w=600",
      category: "Dining"
    },
    {
      title: "Gourmet Dessert Plate",
      image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=600",
      category: "Food"
    }
  ];

  constructor() {}

  ngOnInit(): void {
    // Scroll to top
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }
}
