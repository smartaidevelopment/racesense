import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

interface SwipeState {
  startX: number;
  currentX: number;
  isDragging: boolean;
  transform: number;
}

export class SwipeableCard extends React.Component<
  SwipeableCardProps,
  SwipeState
> {
  private element: HTMLDivElement | null = null;
  private threshold = 100; // Minimum swipe distance

  constructor(props: SwipeableCardProps) {
    super(props);
    this.state = {
      startX: 0,
      currentX: 0,
      isDragging: false,
      transform: 0,
    };
  }

  handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    this.setState({
      startX: touch.clientX,
      currentX: touch.clientX,
      isDragging: true,
    });
  };

  handleTouchMove = (e: React.TouchEvent) => {
    if (!this.state.isDragging) return;

    const touch = e.touches[0];
    const diff = touch.clientX - this.state.startX;
    this.setState({
      currentX: touch.clientX,
      transform: diff,
    });
  };

  handleTouchEnd = () => {
    if (!this.state.isDragging) return;

    const { transform } = this.state;
    const { onSwipeLeft, onSwipeRight } = this.props;

    if (Math.abs(transform) > this.threshold) {
      if (transform > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (transform < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    this.setState({
      isDragging: false,
      transform: 0,
      startX: 0,
      currentX: 0,
    });
  };

  render() {
    const { children, className = "" } = this.props;
    const { transform, isDragging } = this.state;

    return (
      <div
        ref={(el) => (this.element = el)}
        className={`touch-pan-y select-none ${className}`}
        onTouchStart={this.handleTouchStart}
        onTouchMove={this.handleTouchMove}
        onTouchEnd={this.handleTouchEnd}
        style={{
          transform: `translateX(${transform}px)`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
        }}
      >
        {children}
      </div>
    );
  }
}

interface TouchFeedbackProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  haptic?: boolean;
}

interface TouchState {
  isPressed: boolean;
}

export class TouchFeedback extends React.Component<
  TouchFeedbackProps,
  TouchState
> {
  constructor(props: TouchFeedbackProps) {
    super(props);
    this.state = { isPressed: false };
  }

  handleTouchStart = () => {
    this.setState({ isPressed: true });
    if (this.props.haptic && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };

  handleTouchEnd = () => {
    this.setState({ isPressed: false });
    if (this.props.onPress) {
      this.props.onPress();
    }
  };

  render() {
    const { children, className = "" } = this.props;
    const { isPressed } = this.state;

    return (
      <div
        className={`transition-all duration-150 ${
          isPressed ? "scale-95 opacity-80" : "scale-100 opacity-100"
        } ${className}`}
        onTouchStart={this.handleTouchStart}
        onTouchEnd={this.handleTouchEnd}
        onTouchCancel={() => this.setState({ isPressed: false })}
      >
        {children}
      </div>
    );
  }
}

interface MobileCarouselProps {
  items: React.ReactNode[];
  itemsPerView?: number;
  spacing?: number;
  showIndicators?: boolean;
  className?: string;
}

interface CarouselState {
  currentIndex: number;
  isTransitioning: boolean;
}

export class MobileCarousel extends React.Component<
  MobileCarouselProps,
  CarouselState
> {
  private startX = 0;
  private threshold = 50;

  constructor(props: MobileCarouselProps) {
    super(props);
    this.state = {
      currentIndex: 0,
      isTransitioning: false,
    };
  }

  handleTouchStart = (e: React.TouchEvent) => {
    this.startX = e.touches[0].clientX;
  };

  handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const diff = this.startX - endX;

    if (Math.abs(diff) > this.threshold) {
      if (diff > 0) {
        this.next();
      } else {
        this.previous();
      }
    }
  };

  next = () => {
    const { items } = this.props;
    if (this.state.currentIndex < items.length - 1) {
      this.setState({
        currentIndex: this.state.currentIndex + 1,
        isTransitioning: true,
      });
      setTimeout(() => this.setState({ isTransitioning: false }), 300);
    }
  };

  previous = () => {
    if (this.state.currentIndex > 0) {
      this.setState({
        currentIndex: this.state.currentIndex - 1,
        isTransitioning: true,
      });
      setTimeout(() => this.setState({ isTransitioning: false }), 300);
    }
  };

  render() {
    const {
      items,
      itemsPerView = 1,
      spacing = 16,
      showIndicators = true,
      className = "",
    } = this.props;
    const { currentIndex, isTransitioning } = this.state;

    const itemWidth = 100 / itemsPerView;
    const translateX = -(currentIndex * itemWidth);

    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div
          className={`flex transition-transform duration-300 ${
            isTransitioning ? "ease-out" : ""
          }`}
          style={{
            transform: `translateX(${translateX}%)`,
            gap: `${spacing}px`,
          }}
          onTouchStart={this.handleTouchStart}
          onTouchEnd={this.handleTouchEnd}
        >
          {items.map((item, index) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{ width: `${itemWidth}%` }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="absolute inset-y-0 left-2 flex items-center">
          <button
            onClick={this.previous}
            disabled={currentIndex === 0}
            className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="absolute inset-y-0 right-2 flex items-center">
          <button
            onClick={this.next}
            disabled={currentIndex >= items.length - itemsPerView}
            className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Indicators */}
        {showIndicators && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {Array.from({ length: Math.ceil(items.length / itemsPerView) }).map(
              (_, index) => (
                <button
                  key={index}
                  onClick={() =>
                    this.setState({
                      currentIndex: index * itemsPerView,
                      isTransitioning: true,
                    })
                  }
                  className={`w-2 h-2 rounded-full transition-colors ${
                    Math.floor(currentIndex / itemsPerView) === index
                      ? "bg-racing-yellow"
                      : "bg-white/30"
                  }`}
                />
              ),
            )}
          </div>
        )}
      </div>
    );
  }
}

interface ResponsiveGridProps {
  children: React.ReactNode[];
  minItemWidth?: number;
  gap?: number;
  className?: string;
}

export function ResponsiveGrid({
  children,
  minItemWidth = 300,
  gap = 16,
  className = "",
}: ResponsiveGridProps) {
  return (
    <div
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
        gap: `${gap}px`,
      }}
    >
      {children}
    </div>
  );
}

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

interface PullState {
  pullDistance: number;
  isRefreshing: boolean;
  canRefresh: boolean;
}

export class PullToRefresh extends React.Component<
  PullToRefreshProps,
  PullState
> {
  private startY = 0;
  private element: HTMLDivElement | null = null;

  constructor(props: PullToRefreshProps) {
    super(props);
    this.state = {
      pullDistance: 0,
      isRefreshing: false,
      canRefresh: false,
    };
  }

  handleTouchStart = (e: React.TouchEvent) => {
    if (this.element && this.element.scrollTop === 0) {
      this.startY = e.touches[0].clientY;
    }
  };

  handleTouchMove = (e: React.TouchEvent) => {
    if (this.state.isRefreshing || !this.element) return;

    if (this.element.scrollTop === 0 && this.startY > 0) {
      const currentY = e.touches[0].clientY;
      const pullDistance = Math.max(0, currentY - this.startY);

      if (pullDistance > 0) {
        e.preventDefault();
        this.setState({
          pullDistance,
          canRefresh: pullDistance > (this.props.threshold || 60),
        });
      }
    }
  };

  handleTouchEnd = async () => {
    if (this.state.canRefresh && !this.state.isRefreshing) {
      this.setState({ isRefreshing: true });
      try {
        await this.props.onRefresh();
      } finally {
        this.setState({
          isRefreshing: false,
          pullDistance: 0,
          canRefresh: false,
        });
      }
    } else {
      this.setState({ pullDistance: 0, canRefresh: false });
    }
    this.startY = 0;
  };

  render() {
    const { children } = this.props;
    const { pullDistance, isRefreshing, canRefresh } = this.state;

    return (
      <div
        ref={(el) => (this.element = el)}
        className="relative overflow-auto h-full"
        onTouchStart={this.handleTouchStart}
        onTouchMove={this.handleTouchMove}
        onTouchEnd={this.handleTouchEnd}
        style={{
          transform: `translateY(${Math.min(pullDistance * 0.5, 30)}px)`,
          transition: isRefreshing ? "transform 0.3s ease-out" : "none",
        }}
      >
        {/* Pull indicator */}
        {(pullDistance > 0 || isRefreshing) && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full flex items-center justify-center h-16 z-10">
            <div
              className={`transition-all duration-200 ${
                canRefresh || isRefreshing
                  ? "text-racing-green"
                  : "text-muted-foreground"
              }`}
            >
              {isRefreshing ? (
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <div
                  className={`w-6 h-6 border-2 border-current rounded-full transition-transform ${
                    canRefresh ? "rotate-180" : ""
                  }`}
                >
                  <ChevronLeft className="w-full h-full -rotate-90" />
                </div>
              )}
            </div>
          </div>
        )}

        {children}
      </div>
    );
  }
}
