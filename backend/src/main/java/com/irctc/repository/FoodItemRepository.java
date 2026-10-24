package com.irctc.repository;

import com.irctc.entity.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface FoodItemRepository extends JpaRepository<FoodItem, Integer> {
    List<FoodItem> findAllByOrderByCategoryAsc();
    List<FoodItem> findByCategoryIn(Collection<String> categories);
}
