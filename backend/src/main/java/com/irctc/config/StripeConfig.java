package com.irctc.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

/** Sets the Stripe key once at startup (the old code did it in 4 different servlet init() methods). */
@Configuration
public class StripeConfig {

    private static final Logger log = LoggerFactory.getLogger(StripeConfig.class);
    private final AppProperties props;

    public StripeConfig(AppProperties props) {
        this.props = props;
    }

    @PostConstruct
    void init() {
        String key = props.stripe().secretKey();
        if (key != null && !key.isBlank()) {
            Stripe.apiKey = key;
            log.info("Stripe configured.");
        } else {
            log.warn("STRIPE_SECRET_KEY not set: Stripe checkout disabled, 'Dummy Pay' still works.");
        }
    }

    public boolean isEnabled() {
        String key = props.stripe().secretKey();
        return key != null && !key.isBlank();
    }
}
