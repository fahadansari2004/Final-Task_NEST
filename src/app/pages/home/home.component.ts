import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FoodService, Recipe } from '../../services/food.service';
import { FoodCardComponent } from '../../components/food-card/food-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FoodCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  featuredRecipes: Recipe[] = [];
  isLoading = true;

  carouselSlides = [
    {
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1200",
      title: "Artisanal Pizzas",
      subtitle: "Freshly baked in wood-fired ovens with gourmet mozzarella and fresh toppings.",
      link: "/menu",
      category: "Pizza"
    },
    {
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=1200",
      title: "Signature Burgers",
      subtitle: "Juicy premium Angus beef patties stacked with house-made sauces and brioche buns.",
      link: "/menu",
      category: "Burgers"
    },
    {
      image: "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&q=80&w=1200",
      title: "Gourmet Pastas",
      subtitle: "Handcrafted pasta tossed in rich, traditional Italian sauces and fresh herbs.",
      link: "/menu",
      category: "Pasta"
    },
    {
      image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=1200",
      title: "Decadent Desserts",
      subtitle: "Sweet indulgences prepared daily by our pastry chefs to complete your meal.",
      link: "/menu",
      category: "Desserts"
    },
    {
      image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=1200",
      title: "Premium Cocktails & Drinks",
      subtitle: "Crafted mocktails and single-origin coffee specialties with custom infusions.",
      link: "/menu",
      category: "Drinks"
    }
  ];

  testimonials = [
    {
      name: "Sarah Jenkins",
      role: "Gastronome & Critic",
      text: "The culinary experience at FoodieHub is simply unmatched. The gold flake cappuccino and classic pizza were absolute perfection.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
      rating: 5
    },
    {
      name: "David Chen",
      role: "Culinary Blogger",
      text: "Incredible service, stunning atmosphere, and food that is out of this world. Booking a table was seamless. Highly recommended!",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      rating: 5
    },
    {
      name: "Emma Watson",
      role: "Loyal Patron",
      text: "A true gem! The glassmorphism dark aesthetic is beautiful, and the dishes look as good as they taste. A 5-star experience.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200",
      rating: 4
    }
  ];

  constructor(private foodService: FoodService) {}

  ngOnInit(): void {
    this.foodService.getFeaturedRecipes(3).subscribe({
      next: (recipes) => {
        this.featuredRecipes = recipes;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching featured recipes', err);
        this.isLoading = false;
      }
    });
  }
}
