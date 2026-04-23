from core.config import settings

def calculate_net_revenue(sale_price: int, direct_sell: bool = True, tax_rate: float = None) -> float:
    """
    Calculates the net revenue after deducting market taxes.
    If 'tax_rate' is provided, it uses it. Otherwise, defaults to settings.
    """
    if tax_rate is None:
        tax_rate = settings.PREMIUM_TAX_RATE
        if not direct_sell:
            tax_rate += settings.SETUP_FEE_RATE
        
    deduction = sale_price * tax_rate
    return float(sale_price - deduction)

def calculate_profit(buy_price: int, sale_price: int, direct_sell: bool = True, tax_rate: float = None) -> dict:
    """
    Calculate pure profit and ROI percentage.
    """
    net_revenue = calculate_net_revenue(sale_price, direct_sell=direct_sell, tax_rate=tax_rate)
    profit = net_revenue - buy_price
    roi = (profit / buy_price * 100) if buy_price > 0 else 0.0
    
    return {
        "buy_price": buy_price,
        "raw_sale_price": sale_price,
        "net_revenue": round(net_revenue, 2),
        "profit": round(profit, 2),
        "roi_percentage": round(roi, 2)
    }
