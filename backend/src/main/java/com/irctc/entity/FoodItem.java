package com.irctc.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "food_menu")
@Getter
@Setter
public class FoodItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")
    private Integer id;

    @Column(name = "item_name", length = 100)
    private String itemName;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price;

    /** VEG / NON_VEG */
    @Column(name = "type", length = 10)
    private String type;

    /** BREAKFAST / LUNCH / DINNER / SNACKS / ALL_DAY */
    @Column(name = "category", length = 20)
    private String category;

    @Column(name = "image_url", length = 255)
    private String imageUrl;
}
